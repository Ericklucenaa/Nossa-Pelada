export const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const getMonthKey = (isoDate: string): string => {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMonthDisplay = (yyyyMM: string): string => {
  const [year, month] = yyyyMM.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^./, (char) => char.toUpperCase());
};

export const buildIsoFromDateAndTime = (date: string, time: string): string =>
  new Date(`${date}T${time}`).toISOString();

export const parseMoneyInput = (raw: FormDataEntryValue | null): number => {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return 0;
  // Remove dots (thousands) and replace comma with dot (decimals)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getNextMatchDate = (originalIso: string, isFixed?: boolean): string => {
  if (!isFixed) return originalIso;
  const original = new Date(originalIso);
  const now = new Date();
  if (original > now) return originalIso;
  
  const next = new Date(original);
  while (next <= now) {
    next.setDate(next.getDate() + 7);
  }
  return next.toISOString();
};
