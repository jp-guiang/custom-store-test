# Address Autocomplete Setup

The checkout page now includes Shopify-like address autocomplete functionality.

## Features

✅ **Country Detection** - Select country first, then address autocomplete adapts  
✅ **Real-time Suggestions** - Dropdown appears as you type  
✅ **Auto-fill** - Selecting an address auto-fills city, state, and postal code  
✅ **Google Places Integration** - Uses Google Places API for accurate addresses  
✅ **Fallback Mode** - Works without API key (basic suggestions)

---

## Setup Instructions

### Option 1: With Google Places API (Recommended)

1. **Get Google Places API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Places API"
   - Create credentials (API Key)
   - Restrict API key to your domain (optional but recommended)

2. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Option 2: Without API Key (Fallback Mode)

The address autocomplete will still work with basic suggestions:
- Country-specific common addresses
- Simple pattern matching
- Manual entry still works

**Note:** Without Google Places API, addresses won't auto-fill city/state/postal code.

---

## How It Works

### User Flow

1. **Select Country** - User selects country from dropdown (US, CA, GB, AU, NZ)
2. **Type Address** - User starts typing address in "Address Line 1" field
3. **See Suggestions** - Dropdown appears with matching addresses
4. **Select Address** - User clicks on a suggestion
5. **Auto-fill** - City, state, and postal code are automatically filled

### Technical Details

- **Component:** `components/AddressAutocomplete.tsx`
- **API:** Google Places Autocomplete Service
- **Country Filtering:** Addresses filtered by selected country
- **Address Parsing:** Automatically extracts:
  - Street number and name
  - City
  - State/Province
  - Postal code
  - Country

---

## Usage Example

```tsx
import AddressAutocomplete from '@/components/AddressAutocomplete'

<AddressAutocomplete
  value={address}
  country="US"
  onChange={(address) => setAddress(address)}
  onSelect={(details) => {
    // details contains: address1, city, state, postalCode, country
    setShippingAddress(details)
  }}
  error={errors.address}
  placeholder="Start typing your address"
/>
```

---

## Cost Considerations

**Google Places API Pricing:**
- **Autocomplete (per session):** $2.83 per 1,000 sessions
- **Place Details:** $17 per 1,000 requests
- **Free tier:** $200 credit/month (covers ~70,000 autocomplete sessions)

**For POC:** Free tier is usually sufficient

**For Production:** Consider:
- Implementing caching
- Rate limiting
- Using session-based billing (one charge per checkout session)

---

## Alternative Services

If you prefer not to use Google Places API:

1. **Algolia Places** - Free tier available
2. **Mapbox Geocoding** - Pay-as-you-go
3. **Here Geocoding** - Free tier available
4. **Custom API** - Build your own address database

---

## Troubleshooting

### Autocomplete Not Showing
- Check browser console for errors
- Verify API key is set in `.env.local`
- Ensure API key has Places API enabled
- Check API key restrictions (domain/IP)

### Addresses Not Auto-filling
- Verify Google Places API is loaded (check Network tab)
- Check browser console for API errors
- Ensure country code is valid (US, CA, GB, AU, NZ)

### Suggestions Not Filtering by Country
- Verify country prop is being passed correctly
- Check that country code matches Google's format
- Try clearing browser cache

---

## Testing Without API Key

The component includes fallback mode:
- Basic address suggestions based on country
- No auto-fill of city/state/postal code
- Manual entry still works perfectly

This is useful for:
- Development/testing
- Demos
- When API quota is exceeded

