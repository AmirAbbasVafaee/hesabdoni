'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import moment from 'moment-jalaali'

interface JalaliDateInputProps {
  id: string
  label?: string
  value: string // Gregorian date (YYYY-MM-DD) or empty
  onChange: (value: string) => void // Returns Gregorian date
  className?: string
}

export function JalaliDateInput({ id, label, value, onChange, className }: JalaliDateInputProps) {
  const [jalaliValue, setJalaliValue] = useState('')
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (value) {
      try {
        const gregorianDate = moment(value, 'YYYY-MM-DD')
        if (gregorianDate.isValid()) {
          const jalali = gregorianDate.format('jYYYY/jMM/jDD')
          setJalaliValue(jalali)
          setDisplayValue(jalali)
        } else {
          setJalaliValue('')
          setDisplayValue('')
        }
      } catch {
        setJalaliValue('')
        setDisplayValue('')
      }
    } else {
      setJalaliValue('')
      setDisplayValue('')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDisplayValue(input)

    // Parse Jalali date (YYYY/MM/DD or YYYY-MM-DD)
    const cleaned = input.replace(/[^\d\/\-]/g, '')
    const parts = cleaned.split(/[\/\-]/)

    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number)
      
      // Validate Jalali date
      if (year >= 1300 && year <= 1500 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        try {
          const jalaliMoment = moment(`${year}/${month}/${day}`, 'jYYYY/jMM/jDD')
          if (jalaliMoment.isValid()) {
            const gregorian = jalaliMoment.format('YYYY-MM-DD')
            setJalaliValue(cleaned)
            onChange(gregorian)
          }
        } catch {
          // Invalid date, keep display value but don't update
        }
      }
    } else if (cleaned === '') {
      setJalaliValue('')
      onChange('')
    }
  }

  const handleBlur = () => {
    // Format display value on blur
    if (jalaliValue) {
      const parts = jalaliValue.split(/[\/\-]/)
      if (parts.length === 3) {
        const formatted = parts.join('/')
        setDisplayValue(formatted)
      }
    }
  }

  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="۱۴۰۳/۰۹/۱۵"
        dir="rtl"
        className="text-right"
      />
    </div>
  )
}

