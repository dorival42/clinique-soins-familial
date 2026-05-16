import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHTG(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount))
}

export function convertToHTG(amount: number, devise: 'HTG' | 'USD', taux: number): number {
  return devise === 'USD' ? Math.round(amount * taux) : amount
}

export function isoToFr(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const months = ['', 'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${parseInt(d)} ${months[parseInt(m)]} ${y}`
}

export function frToIso(fr: string): string {
  if (!fr) return ''
  const p = fr.split('/')
  if (p.length !== 3) return fr
  return `${p[2]}-${p[1]}-${p[0]}`
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}
