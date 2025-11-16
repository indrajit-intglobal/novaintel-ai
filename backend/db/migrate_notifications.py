"""
Auto-migration: Add missing columns to notifications table if they don't exist.
This runs automatically on server startup.
"""
from sqlalchemy import text, inspect
from db.database import engine

def migrate_notifications():
    """Add missing columns to notifications table."""
    # (name, type, default, nullable, not_null_after)
    columns_to_add = [
        ("type", "VARCHAR(50)", "'info'", False, True),  # NOT NULL
        ("title", "VARCHAR(255)", "'Notification'", False, True),  # NOT NULL
        ("message", "TEXT", "''", False, True),  # NOT NULL
        ("status", "VARCHAR(20)", "'pending'", True, False),  # nullable
        ("is_read", "BOOLEAN", "FALSE", True, False),  # nullable
        ("read_at", "TIMESTAMP WITH TIME ZONE", "NULL", True, False),  # nullable
        ("metadata", "JSON", "NULL", True, False),  # nullable
    ]
    
    try:
        with engine.connect() as conn:
            # Check if notifications table exists
            inspector = inspect(engine)
            if 'notifications' not in inspector.get_table_names():
                print("⚠ Notifications table does not exist yet. It will be created automatically.")
                return
            
            # Check which columns exist
            existing_columns = {col['name'] for col in inspector.get_columns('notifications')}
            
            added_count = 0
            for column_name, column_type, default_value, nullable, not_null_after in columns_to_add:
                if column_name not in existing_columns:
                    try:
                        # For NOT NULL columns, first add as nullable with default, then update existing rows, then set NOT NULL
                        if not_null_after:
                            # Step 1: Add column as nullable with default
                            alter_query = text(f"""
                                ALTER TABLE notifications 
                                ADD COLUMN {column_name} {column_type} DEFAULT {default_value}
                            """)
                            conn.execute(alter_query)
                            conn.commit()
                            
                            # Step 2: Update any NULL values (shouldn't be any, but just in case)
                            update_query = text(f"""
                                UPDATE notifications 
                                SET {column_name} = {default_value} 
                                WHERE {column_name} IS NULL
                            """)
                            conn.execute(update_query)
                            conn.commit()
                            
                            # Step 3: Set NOT NULL
                            not_null_query = text(f"""
                                ALTER TABLE notifications 
                                ALTER COLUMN {column_name} SET NOT NULL
                            """)
                            conn.execute(not_null_query)
                            conn.commit()
                        else:
                            # For nullable columns, just add with default
                            alter_query = text(f"""
                                ALTER TABLE notifications 
                                ADD COLUMN {column_name} {column_type} DEFAULT {default_value}
                            """)
                            conn.execute(alter_query)
                            conn.commit()
                        
                        print(f"✓ Added column to notifications: {column_name}")
                        added_count += 1
                    except Exception as e:
                        print(f"⚠ Failed to add column {column_name} to notifications: {e}")
                        conn.rollback()
            
            if added_count > 0:
                print(f"✓ Migration complete: Added {added_count} column(s) to notifications table")
            else:
                print("✓ All notification columns already exist")
            
    except Exception as e:
        print(f"⚠ Notifications migration error: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - allow server to start even if migration fails

