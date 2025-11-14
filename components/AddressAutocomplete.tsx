'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressSuggestion {
  description: string
  placeId: string
  structuredFormatting: {
    mainText: string
    secondaryText: string
  }
}

interface AddressDetails {
  address1: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressAutocompleteProps {
  value: string
  country: string
  onChange: (address: string) => void
  onSelect: (details: AddressDetails) => void
  error?: string
  placeholder?: string
}

declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

export default function AddressAutocomplete({
  value,
  country,
  onChange,
  onSelect,
  error,
  placeholder = 'Start typing your address',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  // Load Google Places API script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsGoogleLoaded(true)
      initializeAutocomplete()
      return
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsGoogleLoaded(true)
          initializeAutocomplete()
          clearInterval(checkGoogle)
        }
      }, 100)
      return () => clearInterval(checkGoogle)
    }

    // Load Google Places API script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setIsGoogleLoaded(true)
      initializeAutocomplete()
    }
    
    script.onerror = () => {
      console.warn('Google Places API failed to load. Using fallback autocomplete.')
      // Fallback to basic autocomplete
      initializeFallbackAutocomplete()
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current)
      }
    }
  }, [country])

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) {
      return
    }

    // Country code mapping (ISO 3166-1 alpha-2)
    const countryCodeMap: Record<string, string> = {
      'US': 'us',
      'CA': 'ca',
      'GB': 'gb',
      'AU': 'au',
      'NZ': 'nz',
    }

    const countryCode = countryCodeMap[country] || 'us'

    // Create Autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: countryCode },
        fields: ['address_components', 'formatted_address', 'place_id'],
        types: ['address'],
      }
    )

    autocompleteRef.current = autocomplete

    // Handle place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.address_components) {
        return
      }

      // Parse address components
      const addressDetails: AddressDetails = {
        address1: '',
        city: '',
        state: '',
        postalCode: '',
        country: country,
      }

      place.address_components.forEach((component: any) => {
        const types = component.types

        if (types.includes('street_number')) {
          addressDetails.address1 = component.long_name + ' '
        }
        if (types.includes('route')) {
          addressDetails.address1 += component.long_name
        }
        if (types.includes('locality')) {
          addressDetails.city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          addressDetails.state = component.short_name
        }
        if (types.includes('postal_code')) {
          addressDetails.postalCode = component.long_name
        }
        if (types.includes('country')) {
          addressDetails.country = component.short_name
        }
      })

      // Update input value
      onChange(place.formatted_address || value)
      setShowSuggestions(false)

      // Call onSelect callback with parsed details
      onSelect(addressDetails)
    })

    // Handle input changes for suggestions
    const handleInput = () => {
      if (inputRef.current && inputRef.current.value.length > 2) {
        // Use Places AutocompleteService for suggestions
        const service = new window.google.maps.places.AutocompleteService()
        service.getPlacePredictions(
          {
            input: inputRef.current.value,
            componentRestrictions: { country: countryCode },
            types: ['address'],
          },
          (predictions: any[], status: string) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(
                predictions.map((p) => ({
                  description: p.description,
                  placeId: p.place_id,
                  structuredFormatting: p.structured_formatting,
                }))
              )
              setShowSuggestions(true)
            } else {
              setSuggestions([])
              setShowSuggestions(false)
            }
          }
        )
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    inputRef.current.addEventListener('input', handleInput)
  }

  // Fallback autocomplete (when Google Places API is not available)
  const initializeFallbackAutocomplete = () => {
    if (!inputRef.current) return

    const handleInput = () => {
      const input = inputRef.current
      if (!input) return

      const value = input.value.trim()
      if (value.length > 2) {
        // Generate basic suggestions based on country
        const suggestions: AddressSuggestion[] = []
        
        // Country-specific common addresses
        const commonAddresses: Record<string, string[]> = {
          US: ['123 Main Street', '456 Oak Avenue', '789 Elm Drive'],
          CA: ['123 Queen Street', '456 King Avenue', '789 Bay Street'],
          GB: ['123 High Street', '456 Church Road', '789 Park Lane'],
          AU: ['123 George Street', '456 Collins Street', '789 King Street'],
          NZ: ['123 Queen Street', '456 Lambton Quay', '789 Ponsonby Road'],
        }

        const addresses = commonAddresses[country] || commonAddresses['US']
        addresses.forEach((addr) => {
          if (addr.toLowerCase().includes(value.toLowerCase())) {
            suggestions.push({
              description: addr,
              placeId: `fallback_${suggestions.length}`,
              structuredFormatting: {
                mainText: addr,
                secondaryText: '',
              },
            })
          }
        })

        setSuggestions(suggestions.slice(0, 5))
        setShowSuggestions(suggestions.length > 0)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    inputRef.current.addEventListener('input', handleInput)
  }

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    if (!window.google?.maps?.places) {
      // Fallback: just use the description
      onChange(suggestion.description)
      setShowSuggestions(false)
      return
    }

    // Use PlacesService to get full details
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    )

    service.getDetails(
      {
        placeId: suggestion.placeId,
        fields: ['address_components', 'formatted_address'],
      },
      (place: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const addressDetails: AddressDetails = {
            address1: '',
            city: '',
            state: '',
            postalCode: '',
            country: country,
          }

          place.address_components.forEach((component: any) => {
            const types = component.types
            if (types.includes('street_number')) {
              addressDetails.address1 = component.long_name + ' '
            }
            if (types.includes('route')) {
              addressDetails.address1 += component.long_name
            }
            if (types.includes('locality')) {
              addressDetails.city = component.long_name
            }
            if (types.includes('administrative_area_level_1')) {
              addressDetails.state = component.short_name
            }
            if (types.includes('postal_code')) {
              addressDetails.postalCode = component.long_name
            }
            if (types.includes('country')) {
              addressDetails.country = component.short_name
            }
          })

          onChange(place.formatted_address || suggestion.description)
          setShowSuggestions(false)
          onSelect(addressDetails)
        }
      }
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="street-address"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.length > 2 && !isGoogleLoaded) {
            // Trigger fallback suggestions
            const event = new Event('input', { bubbles: true })
            e.target.dispatchEvent(event)
          }
        }}
        onFocus={() => {
          if (value.length > 2) {
            setShowSuggestions(suggestions.length > 0)
          }
        }}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200)
        }}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion.placeId || idx}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {suggestion.structuredFormatting.mainText}
              </div>
              {suggestion.structuredFormatting.secondaryText && (
                <div className="text-sm text-gray-500">
                  {suggestion.structuredFormatting.secondaryText}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {!isGoogleLoaded && !process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <p className="text-xs text-gray-500 mt-1">
          💡 Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to .env.local for full address autocomplete
        </p>
      )}
    </div>
  )
}
