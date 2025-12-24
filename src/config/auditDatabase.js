const mongoose = require('mongoose');

// Separate connection for audit logs
let auditConnection = null;

const connectAuditDB = async () => {
  try {
    if (auditConnection && auditConnection.readyState === 1) {
      return auditConnection;
    }

    const auditDbUri = process.env.AUDIT_MONGO_URI || process.env.MONGO_URI;
    console.log('Connecting to audit database...');
    
    auditConnection = mongoose.createConnection(auditDbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ Audit database timeout - continuing without audit');
        resolve(null);
      }, 5000);
      
      auditConnection.once('connected', () => {
        clearTimeout(timeout);
        console.log('✅ Audit database connected');
        resolve(auditConnection);
      });
      
      auditConnection.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ Audit database error:', err.message);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Audit database failed:', error.message);
    return null;
  }
};

const getAuditConnection = async () => {
  try {
    if (!auditConnection || auditConnection.readyState !== 1) {
      auditConnection = await connectAuditDB();
    }
    return auditConnection;
  } catch (error) {
    console.error('Failed to get audit connection:', error.message);
    return null; // Return null instead of throwing error
  }
};

module.exports = {
  connectAuditDB,
  getAuditConnection
};