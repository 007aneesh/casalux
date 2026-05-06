/**
 * aivoy tool registry.
 *
 * Each tool calls `defineAivoyTool` with its definition; `tools/index.ts`
 * imports them all so the side effects fire on module load.
 */

import type { ZodTypeAny } from 'zod'
import type { AivoyToolDefinition } from './types.js'

const registry = new Map<string, AivoyToolDefinition>()

/**
 * Type-safe tool definition. The generic infers args type from the schema so
 * the handler gets typed args without any explicit annotation.
 *
 * Side effect: registers the tool. Calling twice with the same name is a bug.
 */
export function defineAivoyTool<TSchema extends ZodTypeAny, TResult>(
  def: AivoyToolDefinition<TSchema, TResult>,
): AivoyToolDefinition<TSchema, TResult> {
  if (registry.has(def.name)) {
    throw new Error(`aivoy: tool "${def.name}" already registered`)
  }
  registry.set(def.name, def as unknown as AivoyToolDefinition)
  return def
}

export function getTool(name: string): AivoyToolDefinition | undefined {
  return registry.get(name)
}

export function listTools(): AivoyToolDefinition[] {
  return [...registry.values()]
}
