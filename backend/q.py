import sqlite3
import os

# Assuming db.sqlite3 is in the same directory as this script
# or in the current working directory when the script is run.
DB_FILENAME = 'db.sqlite3'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, DB_FILENAME)

def main():
    conn = None  # Initialize conn to None
    print(f"Attempting to connect to database: {DB_PATH}")

    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        print(f"Please ensure '{DB_FILENAME}' is in the same directory as this script,")
        print(f"or adjust DB_FILENAME/DB_PATH in the script.")
        return

    try:
        # Establish a connection to the SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        print(f"Successfully connected to {DB_FILENAME}")

        print("\n--- Attached Databases ---")
        # To see attached databases
        cursor.execute("PRAGMA database_list;")
        databases = cursor.fetchall()
        if databases:
            for db_info in databases:
                # db_info is a tuple like (seq, name, file)
                print(f"Seq: {db_info[0]}, Name: {db_info[1]}, File: {db_info[2]}")
        else:
            # This case should ideally not happen if PRAGMA database_list works
            print("No attached databases found (this is unusual for PRAGMA database_list).")


        print("\n--- Tables in Main Database ---")
        # To see all tables in main database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        if tables:
            print("Tables found:")
            for table in tables:
                print(f"- {table[0]}")
        else:
            print("No tables found in the main database.")

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Close the connection if it was opened
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()