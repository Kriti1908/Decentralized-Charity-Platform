# Commands to Run the Project Locally

- In root dir, run:
  ```
  npm install
  ```
- In backend dir, run:
  ```
  npm install
  ```
- In frontend dir, run:
  ```
  npm install
  ```
- In root dir, run:
    ```
    npx hardhat node
    ```
- In root dir, run:
  ```
  npm run deploy:local
  ```
- In backend and frontend, run:
    ```
    npm run dev
    ```

### **IMPORTANT:** 
If changing any contract, then after deploying, run:
``` 
npx hardhat run scripts/update_abi.sh --network localhost
```