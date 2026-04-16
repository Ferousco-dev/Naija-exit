const STORAGE_KEY = "naija_exit_user";

export const saveUser = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getUser = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};
