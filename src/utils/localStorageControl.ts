/*
|--------------------------------------------------------------------------
| Local Storage Utility
|--------------------------------------------------------------------------
|
| Provides helper functions to manage browser local storage.
|
*/

/*
|--------------------------------------------------------------------------
| getItem
|--------------------------------------------------------------------------
|
| Retrieves a value from local storage by key.
| Attempts to parse JSON values automatically.
|
| @param key - Storage key
| @returns Parsed value or raw string
|
*/
const getItem = (key: string) => {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(key);

    try {
        return JSON.parse(data as string);
    } catch (err) {
        return data;
    }
};

/*
|--------------------------------------------------------------------------
| setItem
|--------------------------------------------------------------------------
|
| Stores a value in local storage.
|
| @param key - Storage key
| @param value - Value to store
|
*/
const setItem = (key: string, value: string) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(key, value);
};

/*
|--------------------------------------------------------------------------
| removeItem
|--------------------------------------------------------------------------
|
| Removes an item from local storage by its key.
|
| @param key - Storage key
|
*/
const removeItem = (key: string) => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(key);
};

/*
|--------------------------------------------------------------------------
| Module Exports
|--------------------------------------------------------------------------
|
| - getItem: Retrieve local storage value
| - setItem: Store local storage value
| - removeItem: Delete local storage item
|
*/
export { getItem, setItem, removeItem };