import { createContext, useContext, useState } from "react";

const DbContext = createContext(null);

export const DbProvider = ({ children }) => {
  const [db, setDb] = useState(0);
  return <DbContext.Provider value={{ db, setDb }}>{children}</DbContext.Provider>;
};

export const useDb = () => useContext(DbContext);
