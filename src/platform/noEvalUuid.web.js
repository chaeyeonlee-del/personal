const sha1 = require('expo-modules-core/src/uuid/lib/sha1').default;
const v35 = require('expo-modules-core/src/uuid/lib/v35').default;
const { Uuidv5Namespace } = require('expo-modules-core/src/uuid/uuid.types');

function uuidv4() {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('Web Crypto randomUUID is required to create UUIDs.');
  }

  return crypto.randomUUID();
}

const uuid = {
  v4: uuidv4,
  v5: v35('v5', 0x50, sha1),
  namespace: Uuidv5Namespace,
};

module.exports = {
  __esModule: true,
  default: uuid,
};
