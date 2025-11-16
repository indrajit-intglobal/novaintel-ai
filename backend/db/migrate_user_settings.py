"""
Auto-migration: Add user settings columns if they don't exist.
This runs automatically on server startup.
"""
from sqlalchemy import text, inspect
from db.database import engine

def migrate_user_settings():
    """Add missing user settings columns to users table."""
    columns_to_add = [
        ("proposal_tone", "VARCHAR(50)", "'professional'"),
        ("ai_response_style", "VARCHAR(50)", "'balanced'"),
        ("secure_mode", "BOOLEAN", "FALSE"),
        ("auto_save_insights", "BOOLEAN", "TRUE"),
        ("theme_preference", "VARCHAR(20)", "'light'"),
    ]
    
    try:
        with engine.connect() as conn:
            # Check if users table exists
            inspector = inspect(engine)
            if 'users' not in inspector.get_table_names():
                print("⚠ Users table does not exist yet. It will be created automatically.")
                return
            
            # Check which columns exist
            existing_columns = {col['name'] for col in inspector.get_columns('users')}
            
            added_count = 0
            for column_name, column_type, default_value in columns_to_add:
                if column_name not in existing_columns:
                    try:
                        # Add column with default value
                        alter_query = text(f"""
                            ALTER TABLE users 
                            ADD COLUMN {column_name} {column_type} DEFAULT {default_value}
                        """)
                        conn.execute(alter_query)
                        conn.commit()
                        print(f"✓ Added column: {column_name}")
                        added_count += 1
                    except Exception as e:
                        print(f"⚠ Failed to add column {column_name}: {e}")
                        conn.rollback()
            
            if added_count > 0:
                print(f"✓ Migration complete: Added {added_count} column(s) to users table")
            else:
                print("✓ All user settings columns already exist")
            
    except Exception as e:
        print(f"⚠ Migration error: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - allow server to start even if migration fails

