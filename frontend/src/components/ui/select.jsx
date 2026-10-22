"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function normalizeOption(option) {
  if (option == null || option === '') return null;
  if (typeof option === 'object') {
    return {
      value: option.value,
      label: option.label ?? option.value,
    };
  }

  return {
    value: option,
    label: option,
  };
}

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  textSize = 'text-sm',
  wrapValue = false,
  variant = 'default',
  disabled = false,
  multiSelect = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const normalizedOptions = options.map(normalizeOption).filter(Boolean);
  const selectedOption =
    !multiSelect
      ? normalizedOptions.find((option) => option.value === value) || null
      : null;
  const selectedValues = multiSelect
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : [];
  const displayValue = multiSelect
    ? selectedValues.length > 0
      ? normalizedOptions
          .filter((opt) => selectedValues.includes(opt.value))
          .map((opt) => opt.label)
          .join(', ')
      : placeholder
    : selectedOption?.label || value || placeholder;
  const isFilterVariant = variant === 'filter';
  const hasValue = multiSelect ? selectedValues.length > 0 : Boolean(value);

  function getCheckboxClasses(isSelected) {
    if (isFilterVariant) {
      return isSelected
        ? 'border-primary bg-primary text-white'
        : 'border-[#c9c9d4] bg-white text-transparent';
    }

    return isSelected
      ? 'border-primary bg-primary text-white'
      : 'border-gray-300 bg-white text-transparent';
  }

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onScroll(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    if (open) {
      window.addEventListener('scroll', onScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((s) => !s);
        }}
        disabled={disabled}
        className={cn(
          'relative w-full overflow-hidden rounded-[12px] border border-gray-100 bg-white px-4 pr-10 text-left text-small shadow-sm',
          wrapValue ? 'min-h-12 h-auto py-2' : 'h-12',
          hasValue ? 'text-black' : 'text-gray-text',
          disabled && 'cursor-not-allowed bg-gray-50 text-gray-400',
          className,
        )}
      >
        <span
          className={cn(
            'pr-6 block',
            wrapValue ? 'whitespace-normal wrap-break-word line-clamp-2 leading-5' : 'truncate',
            textSize,
          )}
        >
          {displayValue}
        </span>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-text" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full bg-white',
            isFilterVariant
              ? 'rounded-[12px] border border-gray-100 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
              : 'max-h-70 overflow-y-auto rounded-[12px] shadow-md ring-1 ring-black/5'
          )}
        >
          <div className={cn('flex flex-col', isFilterVariant ? 'max-h-70 overflow-y-auto pr-1 gap-1' : 'py-2')}>
            {normalizedOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No options</div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = multiSelect
                  ? selectedValues.includes(opt.value)
                  : opt.value === value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (!onChange) return;

                      if (multiSelect) {
                        if (selectedValues.includes(opt.value)) {
                          onChange(selectedValues.filter((v) => v !== opt.value));
                        } else {
                          onChange([...selectedValues, opt.value]);
                        }
                      } else {
                        onChange(opt.value);
                        setOpen(false);
                      }
                    }}
                    className="w-full text-left text-sm flex items-center gap-3 rounded-[12px] px-3 py-3 text-gray-text hover:bg-[#f8f5ff]"
                  >
                    {isFilterVariant ? (
                      <>
                        <span
                          className={cn('flex h-4 w-4 items-center justify-center rounded-sm border transition-colors', getCheckboxClasses(isSelected))}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className={cn('text-gray-text', isSelected && 'font-medium')}>
                          {opt.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                            getCheckboxClasses(isSelected)
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className={cn('min-w-0 text-gray-text', isSelected && 'font-medium text-sm')}>
                          {opt.label}
                        </span>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
