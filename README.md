# Commands to Run the Project

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Build CSS**:

   ```bash
   npm run build:css
   ```

3. **Start PostgreSQL**:

   Ensure PostgreSQL is running on your machine.

4. **Create the Database and Table**:

   Log into PostgreSQL and create the database and required table:

   ```bash
   psql -U your_pg_username -d postgres
   ```

   Then run the following commands:

   ```sql
   CREATE DATABASE patient_intake;

   \c patient_intake

   CREATE TABLE patients (
       id SERIAL PRIMARY KEY,
       first_name VARCHAR(255),
       middle_name VARCHAR(255),
       last_name VARCHAR(255),
       mobile VARCHAR(15),
       email VARCHAR(255),
       address TEXT,
       insurance_card_uploaded BOOLEAN DEFAULT FALSE,
       insurance_card BYTEA,
       appointment_time VARCHAR(50),
       appointment_date DATE,
       gray_hair BOOLEAN,
       broken_bone BOOLEAN,
       trip_over BOOLEAN,
       insurance_carrier VARCHAR(255),
       policy_number VARCHAR(255)
   );
   ```

5. **Start the Server**:

   ```bash
   npm run start
   ```
