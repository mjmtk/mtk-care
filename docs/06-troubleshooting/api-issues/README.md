# API Issues Troubleshooting

This section contains troubleshooting guides for API-related problems in the MTK-Care system.

## Common API Issues

### [Router Setup Problems](./router-setup.md)
Django Ninja router registration and configuration issues.

**Common symptoms:**
- `ConfigError: Router ... has already been attached` errors
- API endpoints not responding
- Router registration conflicts

### [Redirect Loops](./redirect-loops.md)
Infinite redirects between frontend and backend API.

**Common symptoms:**
- Browser shows "too many redirects" error
- API calls never complete
- Authentication redirect loops

## API Development Best Practices

### Avoiding Common Issues

1. **Router Registration**
   - Register routers only once in main API instance
   - Use proper router organization and naming
   - Avoid circular imports in router modules

2. **Authentication Handling**
   - Properly configure CORS settings
   - Handle authentication redirects correctly
   - Use appropriate middleware ordering

3. **Error Handling**
   - Implement proper exception handling
   - Return meaningful error messages
   - Use correct HTTP status codes

### Debugging API Issues

1. **Check Django Logs**
   - Enable debug mode for development
   - Review server logs for error messages
   - Use Django Debug Toolbar

2. **Test API Endpoints**
   - Use API testing tools (Postman, curl)
   - Verify request/response formats
   - Check authentication headers

3. **Frontend-Backend Communication**
   - Inspect browser network tab
   - Verify API base URLs
   - Check CORS configuration

## Related Documentation

- [Django Ninja Best Practices](../../04-development/backend/django-ninja-best-practices.md)
- [API Design Guidelines](../../03-architecture/api-design/)
- [Authentication Documentation](../../04-development/authentication/)