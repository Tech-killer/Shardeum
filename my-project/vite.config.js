import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks configuration
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ethers': ['ethers'],
          
          // Component chunks by feature
          'admin-components': [
            './src/components/admin/TaskManagement.jsx',
            './src/components/admin/VotingSystem.jsx',
            './src/components/admin/CertificateSystem.jsx'
          ],
          'user-components': [
            './src/components/user/UserTaskDashboard.jsx',
            './src/components/user/ResourceBooking.jsx'
          ],
          'shared-components': [
            './src/components/shared/WalletDashboard.jsx',
            './src/components/shared/ShardeumShowcase.jsx',
            './src/components/shared/TransactionHistory.jsx',
            './src/components/shared/SendTransaction.jsx'
          ],
          'certificates': ['./src/components/certificates/index.js']
        }
      }
    }
  }
})
