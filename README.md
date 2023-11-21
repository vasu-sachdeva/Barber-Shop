# Introduction 

## Purpose  

The purpose of this document is to outline the requirements for the web application “BookBarber”. 

BookBarber is an online application to manage college faculty & student appointments and shop inventory. 

## Product Scope 

The purpose of this online barber shop automation application is to handle customers, and inventory efficiently at barber shop and to create an easy-to-use application for customers. It shall look after inventory management, i.e., refiling of stock and necessary items. It shall be a platform for customers to book appointments. This whole product is designed by taking The LNMIIT barber shop in consideration. 

# Overall Description 

## Product Perspective 

The software will be a new, self-contained product. It is not based on an existing project. 

 

The Frontend of BookBarber will be a web application that displays formatted data to the end user. The web application will be built using Express.JS and will run on a Heroku platform for web services that interfaces with a MySQL server to retrieve and store data. 

 

The backend of BookBarber will be a MySQL server that will store data used by the frontend. The backend will never be accessed directly, but instead manipulated through use of the frontend, which will either query the database for filtered information, or insert new data into the database. 

## Product Functions 

#### Customer can: - 

- Login. 
- View past appointments. 
- View past orders. 
- View time slots available on a particular date. 
- Book their appointment with the barber. 
- Cancel their appointment with the barber. 
- Order any product related to grooming and hairstyling.  

#### Barber Can: - 

- Login. 
- Accept or reject the order. 
- Add Services. 
- Remove services. 
- Update the services provided. 
- Manage inventory. 
- Block mischievous customers. 

