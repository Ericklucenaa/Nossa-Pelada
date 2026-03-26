import { createContext } from 'react';
import type { AppContextType } from './AppDataContext';

export const AppContext = createContext<AppContextType | undefined>(undefined);
