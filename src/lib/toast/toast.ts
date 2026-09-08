import type {NotificationInstance} from "antd/es/notification/interface";
import {playErrorSound} from "@/lib/audio/sound";

/*
|--------------------------------------------------------------------------
| Toast Options
|--------------------------------------------------------------------------
|
| Defines the common options supported by application toast notifications.
|
*/

type ToastOptions = {
    message: string;
    description?: string;
    duration?: number;
};

/*
|--------------------------------------------------------------------------
| Notification Instance
|--------------------------------------------------------------------------
|
| Stores the Ant Design notification instance provided by the App component.
|
*/

let notificationInstance: NotificationInstance | null = null;

/*
|--------------------------------------------------------------------------
| Set Notification Instance
|--------------------------------------------------------------------------
|
| Sets the notification instance used by the toast service.
|
*/

export const setNotificationInstance = (
    instance: NotificationInstance
) => {
    notificationInstance = instance;
};

/*
|--------------------------------------------------------------------------
| Toast
|--------------------------------------------------------------------------
|
| Provides reusable toast notifications that can be triggered from
| different parts of the application.
|
*/

export const toast = {

    /*
    |--------------------------------------------------------------------------
    | Success Toast
    |--------------------------------------------------------------------------
    */

    success: ({message, description, duration = 4,}: ToastOptions) => {
        notificationInstance?.success({
            title: message,
            description,
            placement: "bottomRight",
            duration,
        });
    },

    /*
    |--------------------------------------------------------------------------
    | Error Toast
    |--------------------------------------------------------------------------
    */

    error: ({message, description, duration = 4,}: ToastOptions) => {
        playErrorSound();

        notificationInstance?.error({
            title: message,
            description,
            placement: "bottomRight",
            duration,
        });
    },

    /*
    |--------------------------------------------------------------------------
    | Warning Toast
    |--------------------------------------------------------------------------
    */

    warning: ({message, description, duration = 4,}: ToastOptions) => {
        notificationInstance?.warning({
            title: message,
            description,
            placement: "bottomRight",
            duration,
        });
    },

    /*
    |--------------------------------------------------------------------------
    | Info Toast
    |--------------------------------------------------------------------------
    */

    info: ({message, description, duration = 4,}: ToastOptions) => {
        notificationInstance?.info({
            title: message,
            description,
            placement: "bottomRight",
            duration,
        });
    },
};