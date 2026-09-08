/*
|--------------------------------------------------------------------------
| Application Sound
|--------------------------------------------------------------------------
|
| Provides reusable application sounds that can be triggered from
| different parts of the application.
|
*/

export const playNotificationSound = () => {
    const audio = new Audio("/sounds/notification.mp3");

    audio.volume = 0.5;

    audio.play().catch((error) => {
        console.warn(
            "Unable to play notification sound.",
            error
        );
    });
};


export const playErrorSound = () => {
    const audio = new Audio("/sounds/error.mp3");

    audio.volume = 0.5;

    audio.play().catch((error) => {
        console.warn(
            "Unable to play error sound.",
            error
        );
    });
};