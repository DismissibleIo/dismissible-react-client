# Testing MSW Toggle Functionality

## Quick Test Guide

### Prerequisites
1. Ensure the API is running on `http://localhost:3200`
2. Ensure the API has the dismissible endpoints available

### Start Storybook
```bash
cd react-client
npm run storybook
```

### Test Steps

1. **Open Storybook**
   - Navigate to `http://localhost:6006`
   - Go to Components → Dismissible

2. **Test MSW Toggle Demo Story**
   - Click on "MSW Toggle Demo" story
   - Look for the MSW icon (🔧/🌐) in the toolbar
   - Notice the status indicator in top-right corner

3. **Test with MSW ON (Default)**
   - Should show "🔧 MSW: ON" status
   - Try dismissing the item (click X button)
   - Open DevTools → Network tab
   - Should see no real network requests
   - Response should be immediate/fast

4. **Test with MSW OFF**
   - Click MSW toolbar icon → Select "MSW Disabled (Real API)"
   - Should show "🌐 MSW: OFF" status
   - Try dismissing the item again
   - Should see real HTTP requests in Network tab
   - Response time may be slower (real network)

5. **Verify API Integration**
   - With MSW OFF, requests should go to `http://localhost:3200`
   - Should see actual GET and DELETE requests
   - Check browser console for MSW status messages

### Expected Behavior

| Mode | Status | Network Requests | Response Time | Console Message |
|------|--------|------------------|---------------|-----------------|
| MSW ON | 🔧 MSW: ON | None (mocked) | Instant | "🔧 MSW enabled - using mocked responses" |
| MSW OFF | 🌐 MSW: OFF | Real HTTP calls | Network dependent | "🌐 MSW disabled - using real API endpoints" |

### Troubleshooting

- **MSW toggle not working**: Refresh the page
- **Real API calls failing**: Ensure API server is running on port 3200
- **Status not updating**: Check browser console for errors

### Additional Testing

Try other stories with the toggle:
- "Default" - Basic dismissible behavior
- "Error State" - See how real vs mocked errors differ
- "Loading State" - Compare loading times

This allows you to validate that your components work correctly with both mocked data (for development) and real API endpoints (for integration testing).