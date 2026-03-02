/**
 * useDeepLink
 *
 * Synchronises a piece of component state with a URL search-parameter so that
 * the current view can be bookmarked, shared or refreshed without losing
 * context.
 *
 * Usage:
 *   const [classId, setClassId] = useDeepLink('classId', '')
 *
 * The value is read from / written to `?classId=<value>` in the URL.
 * Calling `setClassId('KG')` pushes a new history entry so the browser Back
 * button works as expected.
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * @param {string} key       - URL search param name
 * @param {*}      defaultValue - Value used when the param is absent
 * @returns {[string, function]} [value, setValue]
 */
export function useDeepLink(key, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = searchParams.has(key) ? searchParams.get(key) : defaultValue

  const setValue = useCallback(
    (newValue) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (newValue === defaultValue || newValue === '' || newValue == null) {
            next.delete(key)
          } else {
            next.set(key, String(newValue))
          }
          return next
        },
        { replace: false } // push so Back button works
      )
    },
    [key, defaultValue, setSearchParams]
  )

  return [value, setValue]
}

/**
 * useDeepLinks
 *
 * Convenience wrapper for syncing multiple URL params at once.
 *
 * Usage:
 *   const [params, setParams] = useDeepLinks({ classId: '', tab: 'list' })
 *   setParams({ classId: 'KG' })   // merges with existing params
 *   setParams({ classId: '' })     // removes the param
 */
export function useDeepLinks(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Build current state from URL, falling back to defaults
  const params = {}
  for (const key of Object.keys(defaults)) {
    params[key] = searchParams.has(key) ? searchParams.get(key) : defaults[key]
  }

  const setParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            const def = defaults[key]
            if (value === def || value === '' || value == null) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }
          return next
        },
        { replace: false }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams]
  )

  return [params, setParams]
}

/**
 * buildDeepLink
 *
 * Pure helper – builds an absolute path+search string that can be used with
 * react-router's <Link to={…}> or navigate(…).
 *
 * Example:
 *   buildDeepLink('/fees/vouchers', { classId: 'KG', month: '2026-03' })
 *   // → "/fees/vouchers?classId=KG&month=2026-03"
 */
export function buildDeepLink(pathname, params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
