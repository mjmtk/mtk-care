# Database Documentation

This section contains database design patterns, migration guides, and data management documentation.

## Overview

The MTK-Care system uses PostgreSQL in production with SQLite for local development. All models use UUID primary keys and follow Django ORM best practices.

## Documentation Files

### [UUID Migration Guide](./uuid-migration-guide.md)
Complete guide for implementing UUID primary keys across all models.

**Key topics:**
- Migration strategy and procedures
- UUID field configuration
- Data migration scripts
- API integration updates

## Database Design Principles

### 1. UUID Primary Keys
- All models use UUID instead of auto-incrementing integers
- Better security and privacy
- Easier data migration between environments
- Support for distributed systems

### 2. Audit Trail Pattern
- Created/updated timestamps on all models
- User tracking for changes
- Soft delete functionality
- Change history logging

### 3. Data Integrity
- Foreign key constraints
- Proper indexing for performance
- Data validation at database level
- Backup and recovery procedures

### 4. Scalability Considerations
- Efficient query patterns
- Database connection pooling
- Read replica support
- Performance monitoring

## Schema Overview

### Core Models
- **User**: System users and authentication
- **Client**: Service recipients
- **Referral**: Inter-agency referrals
- **Program**: Service programs
- **Organization**: Partner organizations

### Relationship Patterns
- Many-to-many through explicit through models
- Soft foreign keys using UUIDs
- Hierarchical data structures
- Temporal data handling

## Performance Optimization

### Indexing Strategy
- UUID primary keys with proper indexing
- Composite indexes for common queries
- Full-text search indexes where needed
- Foreign key indexes for joins

### Query Optimization
- Use select_related and prefetch_related
- Avoid N+1 query problems
- Database-level aggregations
- Proper use of annotations

## Migration Management

### Development Workflow
1. Create model changes
2. Generate migrations
3. Review migration files
4. Test in development environment
5. Deploy to staging/production

### Data Migration Best Practices
- Always backup before migrations
- Test migrations on copy of production data
- Plan for rollback scenarios
- Monitor migration performance