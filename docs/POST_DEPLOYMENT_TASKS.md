# Post-Deployment Tasks

This document outlines tasks that may need to be performed after deploying the application.

## Re-initialize Azure AD Group to Django Role Mappings

This task is necessary when the mapping between Azure Active Directory (AD) groups and internal Django application roles needs to be updated or re-initialized. This typically involves changing the Azure AD Group Object ID associated with specific roles in the `grouprolemapping.json` fixture.

### Prerequisites

1.  **SSH Access**: You need SSH access to the Azure App Service backend environment where the Django application is running (e.g., via WebSSH from the Azure portal: `https://<your-app-name>.scm.azurewebsites.net/webssh/host`).
2.  **Azure AD Group Object IDs**: You must know the old Azure AD Group Object ID that needs to be replaced and the new Azure AD Group Object ID to replace it with.
3.  **Application Path**: You need to know the path to the application's root directory on the Azure server (e.g., `/tmp/8dda371cac5577e` as seen in logs, but this can be dynamic; typically, it might be `/home/site/wwwroot` or similar for Azure App Services).
4.  **Fixture Path**: The fixture file is typically located at `apps/users/fixtures/grouprolemapping.json` relative to the application root.

### Steps

The following steps are based on the commands found in `scripts/group_mappings_onazure.sh`.

1.  **Connect to Azure Backend**: Establish an SSH session to your Azure App Service backend.

2.  **Navigate to Application Directory**: Change to the directory where your Django application code is located.
    ```bash
    # Example: cd /home/site/wwwroot
    cd <your_application_path_on_azure>
    ```

3.  **Activate Virtual Environment**: If your application uses a Python virtual environment, activate it. The script comments suggest an environment named `antenv`.
    ```bash
    # Example: source /antenv/bin/activate
    source <path_to_your_virtualenv>/bin/activate
    ```

4.  **Update Group ID in Fixture**: Use the `sed` command to replace the old Azure AD Group Object ID with the new one within the `grouprolemapping.json` fixture. The command `sed -i.bak ...` will create a backup of the original file with a `.bak` extension.

    Replace `OLD_GROUP_ID` and `NEW_GROUP_ID` with the actual IDs.
    ```bash
    sed -i.bak 's/OLD_GROUP_ID/NEW_GROUP_ID/g' apps/users/fixtures/grouprolemapping.json
    ```
    For example, as seen in `scripts/group_mappings_onazure.sh`:
    ```bash
    # sed -i.bak 's/086c146e-0c4a-4bde-a657-30f24290aab0/1130ad2c-9c54-46f2-9302-bc5a2604d7ea/g' apps/users/fixtures/grouprolemapping.json
    ```

5.  **Load the Updated Fixture**: Use Django's `manage.py loaddata` command to load the modified fixture into the database.
    ```bash
    python manage.py loaddata apps/users/fixtures/grouprolemapping.json
    ```

### Using `scripts/group_mappings_onazure.sh`

The file `scripts/group_mappings_onazure.sh` currently contains commented-out commands that serve as a log or reference for performing these steps. You can adapt these commands for manual execution. For frequent use, consider turning this into a parameterized script.

**Important Notes**:
*   The application path (e.g., `/tmp/8dda371cac5577e`) mentioned in the script comments might be specific to a particular session or deployment instance. Always verify the correct path to your application's code and virtual environment on Azure.
*   Ensure the Azure AD Group Object IDs are correct before running the `sed` command.
*   Loading data directly can have significant impacts. Understand the structure of your fixture and its effect on the database.
