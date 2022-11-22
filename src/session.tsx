import { RandomIdGenerator } from '@opentelemetry/sdk-trace-base';

const idGenerator = new RandomIdGenerator();

let session = {
  startTime: Date.now(), //good enough for now
  id: idGenerator.generateTraceId(),
};

const SESSION_UPDATE_INTERVAL = 60 * 1000;
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000;

setInterval(() => {
  updateSessionStatus();
}, SESSION_UPDATE_INTERVAL);

export function getSession() {
  return session;
}

function updateSessionStatus() {
  // TODO Temporary
  if (Date.now() > session.startTime + MAX_SESSION_AGE) {
    const newSessionId = idGenerator.generateTraceId();
    console.log('CLIENT:session:sessionExpired: ', session.id, newSessionId);
    session.id = newSessionId;
  }
}

export function _generatenewSessionId() {
  session.id = idGenerator.generateTraceId();
  console.log('CLIENT:session:generateNewId: ', session.id);
}
