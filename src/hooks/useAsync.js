import { useState, useCallback } from 'react'

export const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(
    async (...params) => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await asyncFunction(...params)
        setData(result)
        return result
      } catch (err) {
        setError(err.message || 'An error occurred')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return { loading, error, data, execute, reset }
}

export const useFormSubmit = () => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = useCallback(async (submitFunction) => {
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await submitFunction()
      setSubmitting(false)
      return result
    } catch (err) {
      setError(err.message || 'Submission failed')
      setSubmitting(false)
      throw err
    }
  }, [submitting])

  const reset = useCallback(() => {
    setSubmitting(false)
    setError(null)
  }, [])

  return { submitting, error, handleSubmit, reset }
}
