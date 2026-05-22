# EMI Calculator Backend Implementation Plan

This plan outlines the architecture, database schema, and logic for the EMI Calculator backend, focusing on a stack that is perfectly suited for an **AWS EC2 Free Tier (t2.micro / t3.micro)** deployment and easy CI/CD integration.

## Proposed Tech Stack
- **Node.js with Express** and **TypeScript** (to match the frontend language). 
- **Database**: **Prisma ORM with SQLite**. 
*Why SQLite?* It is a lightweight, serverless database that stores data in a file. It consumes virtually zero RAM, making it perfect for an EC2 free tier instance where memory is limited (1GB). It doesn't require setting up a separate RDS database instance.

## Open Questions for You:
1. **Interest Calculation**: You mentioned "interest are calculated stored". I will assume a **Flat Rate Interest** model where the total interest is calculated upfront. Example: Loan = ₹10,000, Interest = 10%. Total to be paid = ₹11,000. The balance starts at ₹11,000 and payments directly reduce this balance. Is this simple model correct, or do you need a reducing balance compounding interest formula?
2. **Project Structure**: I will create the backend as a completely separate folder alongside the frontend (e.g., `d:\TEST\emi-calculator-backend`). Is this acceptable?
3. **AWS Deployment**: Do you already have an AWS account with an EC2 instance running, or should I just provide the CI/CD scripts (like GitHub Actions) and deployment instructions for you to use later?

## Proposed Changes

### 1. Project Initialization
- Create a new backend directory `emi-calculator-backend`.
- Initialize Node.js, Express, TypeScript, and Prisma.

### 2. Database Schema (Prisma)
- **`Borrower` Model**:
  - `id`: UUID
  - `name`: String
  - `amountTaken`: Float (Principal)
  - `fixedInterest`: Float (Percentage)
  - `totalAmount`: Float (Principal + Calculated Interest)
  - `balance`: Float (Remaining amount to be paid)
  - `dueDate`: DateTime
  - `penalty`: Float
- **`Payment` Model**:
  - `id`: UUID
  - `borrowerId`: Relation to Borrower
  - `amount`: Float
  - `paymentDate`: DateTime

### 3. API Endpoints
- `GET /api/borrowers`: Fetch all borrowers.
- `POST /api/borrowers`: Add a new borrower. (Will calculate `totalAmount` based on principal + interest).
- `POST /api/borrowers/:id/payments`: Process a payment. 
  - **Logic**: Deducts the paid amount from the borrower's `balance`. Handles partial, full, or over-payments. If balance hits `0` or less, the loan finishes early.

### 4. Frontend Integration
- Modify `HomeScreen.tsx` and `PlayerCard.tsx` to use `fetch` to retrieve the data from the backend instead of using the local mock data.
- Update the `onPayEmi` function to call the `POST /payments` endpoint.

### 5. CI/CD & Deployment Setup
- Create a `ecosystem.config.js` for PM2 (to keep the app running on EC2).
- Create a sample GitHub Actions YAML workflow that SSHs into the EC2 instance, pulls the latest code, and restarts PM2.
