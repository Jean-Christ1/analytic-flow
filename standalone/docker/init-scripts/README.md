# Database Initialization Scripts

Scripts in this directory are automatically executed when the PostgreSQL container starts for the first time.

## Setup

Copy the SQL initialization scripts here:

```bash
cp ../scripts/sql/00_init_database.sql ./00_init_database.sql
```

Or create a symbolic link (Linux/Mac):

```bash
ln -s ../../scripts/sql/00_init_database.sql ./00_init_database.sql
```

## Execution Order

Scripts are executed in alphabetical order. Use numeric prefixes to control order:

- `00_init_database.sql` - First
- `01_seed_data.sql` - Second
- etc.

## Notes

- Scripts only run on first container start (when volume is empty)
- To re-run, remove the volume: `docker volume rm apex-postgres-data`
- Check logs for errors: `docker logs apex-postgres`
