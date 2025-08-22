// Frontend helper for sending automation commands to a local backend
// Usage:
// - Import tryAutomationForTarget in your UI logic and call it when you parse commands like "open <target>"
// - The backend should be a local Flask (or similar) server exposing POST /command that accepts { command }

export const BACKEND_URL = import.meta.env.VITE_AUTOMATION_API || 'http://127.0.0.1:5000'
const AUTH_TOKEN = import.meta.env.VITE_AUTOMATION_TOKEN as string | undefined

export type AutomationResult = { status: 'success' | 'error'; message: string }

export async function sendAutomationCommand(command: string): Promise<AutomationResult> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
    const res = await fetch(`${BACKEND_URL}/command`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ command }),
    })
    const data = (await res.json()) as AutomationResult
    return data
  } catch (e) {
    return { status: 'error', message: 'Backend unreachable. Is the automation server running?' }
  }
}

// Map spoken targets to normalized backend commands (allowlist on the backend should match these)
export function mapTargetToCommand(target: string): string | null {
  const t = target.toLowerCase().trim()
  const table: Record<string, string> = {
    // apps
    notepad: 'open notepad',
    'note pad': 'open notepad',
    calculator: 'open calculator',
    'calc': 'open calculator',
    chrome: 'open chrome',
    'google chrome': 'open chrome',
    vscode: 'open vscode',
    'vs code': 'open vscode',
    paint: 'open paint',

    // folders
    documents: 'open documents',
    'my documents': 'open documents',
    downloads: 'open downloads',
    'my downloads': 'open downloads',
    pictures: 'open pictures',
    photos: 'open pictures',
    desktop: 'open desktop',
  }
  return table[t] || null
}

// Try to automate a target; returns whether we handled it
export async function tryAutomationForTarget(target: string): Promise<{ handled: boolean; result?: AutomationResult }> {
  const mapped = mapTargetToCommand(target)
  if (!mapped) return { handled: false }
  const result = await sendAutomationCommand(mapped)
  return { handled: true, result }
}
