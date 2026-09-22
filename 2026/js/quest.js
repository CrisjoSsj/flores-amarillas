import { startLockGate } from './lock.js';

export function startQuest({ prefersReducedMotion, onHold, onMatch, onFinished }) {
    const openGarden = () => {
        document.body.classList.add('is-unlocking');
        document.body.classList.remove('not-loaded');
        window.setTimeout(() => {
            document.body.classList.remove('is-locked', 'is-unlocking');
            onFinished();
        }, prefersReducedMotion ? 0 : 400);
    };

    startLockGate({
        prefersReducedMotion,
        onHold,
        onMatch,
        onComplete: openGarden
    });
}
