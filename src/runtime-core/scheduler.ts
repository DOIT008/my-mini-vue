const queue: any[] = [];
let isFlashPending = false;
const p = Promise.resolve()
export function queueJobs(job) { 
  if (!queue.includes(job)) {
    queue.push(job)
  }
  QueueFlash()
}

export function nextTick(callback) {
   return callback? p.then(callback):p
}
function QueueFlash() {
  if (isFlashPending) return;
  isFlashPending = true;
  nextTick(flashJobs)
}

function flashJobs() {
  isFlashPending = false;
  let job;
  while (job = queue.shift()) {
    job && job();
  }
}
