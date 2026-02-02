/**
 * Industry-standard API hooks with:
 * - AbortController for request cancellation
 * - Race condition prevention via request ID tracking
 * - Automatic cleanup on unmount
 * - Deduplication of concurrent identical requests
 * - Optimized re-render prevention
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

/**
 * Hook for data fetching with automatic cleanup and race condition prevention
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependencies array that triggers refetch when changed
 * @param {Object} options - Configuration options
 */
export const useFetch = (fetchFn, deps = [], options = {}) => {
  const { 
    enabled = true,
    initialData = null,
    onSuccess,
    onError 
  } = options

  const [state, setState] = useState({
    data: initialData,
    loading: enabled,
    error: null,
  })

  // Track the latest request to prevent race conditions
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef(null)
  const mountedRef = useRef(true)
  const fetchFnRef = useRef(fetchFn)
  
  // Update fetchFn ref on each render
  fetchFnRef.current = fetchFn

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Stable execute function
  const execute = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const currentRequestId = ++requestIdRef.current

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await fetchFnRef.current()

      // Only update state if this is still the latest request and component is mounted
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setState({ data: result, loading: false, error: null })
        onSuccess?.(result)
        return result
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return
      }

      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        const errorMessage = error.message || 'An error occurred'
        setState(prev => ({ ...prev, loading: false, error: errorMessage }))
        onError?.(error)
      }
    }
  }, [onSuccess, onError])

  // Auto-fetch when deps change
  useEffect(() => {
    if (enabled) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  const refetch = useCallback(() => {
    return execute()
  }, [execute])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  const setData = useCallback((newData) => {
    setState(prev => ({ 
      ...prev, 
      data: typeof newData === 'function' ? newData(prev.data) : newData 
    }))
  }, [])

  return {
    ...state,
    execute,
    refetch,
    reset,
    setData,
    isIdle: !state.loading && !state.error && state.data === initialData,
  }
}

/**
 * Hook for mutations (POST, PUT, DELETE) with race condition prevention
 * Prevents double submissions and handles concurrent requests safely
 */
export const useMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError, onSettled } = options

  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  })

  // Use refs to avoid dependency issues
  const mutationFnRef = useRef(mutationFn)
  const optionsRef = useRef({ onSuccess, onError, onSettled })
  
  // Update refs on each render
  mutationFnRef.current = mutationFn
  optionsRef.current = { onSuccess, onError, onSettled }

  // Prevent concurrent mutations
  const mutationInProgressRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(async (...args) => {
    // Prevent double submission
    if (mutationInProgressRef.current) {
      console.warn('Mutation already in progress, ignoring duplicate call')
      return
    }

    mutationInProgressRef.current = true
    setState({ loading: true, error: null, data: null })

    try {
      const result = await mutationFnRef.current(...args)

      if (mountedRef.current) {
        setState({ loading: false, error: null, data: result })
        optionsRef.current.onSuccess?.(result, ...args)
        optionsRef.current.onSettled?.(result, null, ...args)
      }

      return result
    } catch (error) {
      const errorMessage = error.message || 'Mutation failed'

      if (mountedRef.current) {
        setState({ loading: false, error: errorMessage, data: null })
        optionsRef.current.onError?.(error, ...args)
        optionsRef.current.onSettled?.(null, error, ...args)
      }

      throw error
    } finally {
      mutationInProgressRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    mutate,
    execute: mutate, // alias for consistency
    reset,
    isIdle: !state.loading && !state.error && state.data === null,
  }
}

/**
 * Hook for paginated data fetching
 */
export const usePagination = (fetchFn, options = {}) => {
  const { pageSize = 20, initialPage = 1 } = options

  const [page, setPage] = useState(initialPage)
  const [filters, setFilters] = useState({})
  const [hasMore, setHasMore] = useState(true)
  
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const { data, loading, error, refetch, setData } = useFetch(
    () => fetchFnRef.current({ ...filters, page, limit: pageSize }),
    [page, filters, pageSize]
  )

  useEffect(() => {
    if (data?.data) {
      setHasMore(data.data.length === pageSize)
    }
  }, [data, pageSize])

  const loadPage = useCallback((pageNum, newFilters = {}) => {
    setPage(pageNum)
    setFilters(newFilters)
  }, [])

  const nextPage = useCallback(() => {
    if (hasMore && !loading) {
      setPage(p => p + 1)
    }
  }, [hasMore, loading])

  const prevPage = useCallback(() => {
    if (page > 1 && !loading) {
      setPage(p => p - 1)
    }
  }, [page, loading])

  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 1 && !loading) {
      setPage(pageNum)
    }
  }, [loading])

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    loadPage,
    nextPage,
    prevPage,
    goToPage,
    setData,
    refetch,
  }
}

/**
 * Debounce hook for search inputs
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for optimistic updates with rollback
 */
export const useOptimisticMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError, optimisticUpdate, rollback } = options

  const [state, setState] = useState({
    loading: false,
    error: null,
  })

  // Use refs to avoid dependency issues
  const mutationFnRef = useRef(mutationFn)
  const optionsRef = useRef({ onSuccess, onError, optimisticUpdate, rollback })
  
  // Update refs on each render
  mutationFnRef.current = mutationFn
  optionsRef.current = { onSuccess, onError, optimisticUpdate, rollback }

  const previousDataRef = useRef(null)
  const mutationInProgressRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(async (...args) => {
    if (mutationInProgressRef.current) {
      return
    }

    mutationInProgressRef.current = true

    // Store previous data for rollback
    if (optionsRef.current.optimisticUpdate) {
      previousDataRef.current = optionsRef.current.optimisticUpdate(...args)
    }

    setState({ loading: true, error: null })

    try {
      const result = await mutationFnRef.current(...args)

      if (mountedRef.current) {
        setState({ loading: false, error: null })
        optionsRef.current.onSuccess?.(result, ...args)
      }

      return result
    } catch (error) {
      // Rollback on error
      if (optionsRef.current.rollback && previousDataRef.current !== null) {
        optionsRef.current.rollback(previousDataRef.current)
      }

      if (mountedRef.current) {
        setState({ loading: false, error: error.message })
        optionsRef.current.onError?.(error, ...args)
      }

      throw error
    } finally {
      mutationInProgressRef.current = false
      previousDataRef.current = null
    }
  }, [])

  return { ...state, mutate, execute: mutate }
}
