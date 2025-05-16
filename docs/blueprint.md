# **App Name**: ConnectHost

## Core Features:

- Role-Based Access: Multi-role access control (admin, host, client) based on the 'Role' field in the 'Users' table, restricting data access to relevant information for each role.
- Dynamic Forms: Dynamic form generation based on 'ChampsFormulaires' table, allowing hosts to create custom forms for their services. Form rendering and submission will use the data definitions specified in 'ChampsFormulaires'.
- QR Code Generation: Automatic generation of unique URLs for rooms/tables upon creation, encoding HostID and Room/Table ID. This URL will link to a filtered view of services for the respective host.
- Service Filtering: Service filtering for clients based on HostID derived from the scanned QR code. Display available services for the related host to clients.

## Style Guidelines:

- Primary color: A calming blue (#64B5F6) to evoke trust and reliability.
- Background color: Light, desaturated blue (#E3F2FD) for a clean, professional feel.
- Accent color: A soft purple (#9575CD) to add a touch of creativity and uniqueness.
- Clean and readable sans-serif fonts to ensure clarity across all devices and roles.
- Simple, modern icons representing different services and categories, enhancing usability.
- Clear, intuitive layouts tailored to each user role (admin, host, client) for efficient navigation and data management.