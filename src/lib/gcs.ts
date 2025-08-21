import { Storage } from '@google-cloud/storage';
import { getServerConfig } from './runtime-config';

const config = getServerConfig();
const projectId = config.server.googleCloudProjectId;

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId,
  // When deployed on Cloud Run, authentication will be handled automatically
  // For local development, you'll need to set up Application Default Credentials
});


export default storage;
