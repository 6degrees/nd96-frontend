/*
|--------------------------------------------------------------------------
| buildQuery
|--------------------------------------------------------------------------
|
| Cleans an object by removing empty values (undefined, null, "").
| Used to prepare API query params and prevent sending empty filters.
|
| @param obj - Key/value object containing query params
| @returns Clean object with only valid values
|
*/
export const buildQuery = (obj: Record<string, any>) => {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([_, value]) => value !== undefined && value !== null && value !== ""
        )
    );
};