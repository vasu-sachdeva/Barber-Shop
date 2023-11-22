drop database if exists bshop;
create database bshop;
use bshop;

create table Inventory ( itemId int NOT NULL auto_increment, itemName VARCHAR(30), qtyAvail int, PRIMARY KEY (itemId), itemStatus varchar(15) );
CREATE TABLE Services ( serviceId int NOT NULL auto_increment, serviceName varchar(50), forGender varchar(15), price int, serviceStatus varchar(15), primary key(serviceId));
create table Materials (serviceId int NOT NULL, itemId int, foreign key (serviceId) references Services(serviceId), foreign key (itemId) references Inventory(itemId), UNIQUE INDEX (serviceId, itemId));
create table Customers (mobNumber varchar(20), primary key(mobNumber));
create table Orders ( orderId int NOT NULL auto_increment, orderDate varchar(30), orderTime varchar(20), mobNumber varchar(20), product varchar(50), orderStatus varchar(10), amount int, qty int, customerName varchar(30), deliveryDate varchar(20), primary key(orderId), foreign key(mobNumber) references Customers(mobNumber));
create table Appointments (appointmentId int NOT NULL auto_increment, isPaid boolean, date varchar(20), mobNumber varchar(20), gender varchar(15), custName varchar(30), feedback varchar(500), startTime time, endTime time, amount int, primary key(appointmentId), foreign key (mobNumber) references Customers(mobNumber));
create table AppointmentServices (appointmentId int, serviceId int, foreign key(appointmentId) references Appointments(appointmentId), foreign key(serviceId) references Services(serviceId));
create table blocklist ( mobNumber varchar(20), reason varchar(100));


INSERT INTO Inventory
(`itemName`,
`qtyAvail`,`itemStatus`)
VALUES
('Blades',10,'Active'),
('Cutting Cloth',10,'Active'),
('Protective Cape',10,'Active'),
('Disposable Combs',10,'Active'),
('Disposable Brushes',10,'Active'),
('Hair Dye',10,'Active');

INSERT INTO Services
(`serviceName`,
`forGender`,
`price`, `serviceStatus`)
VALUES
('HairCut','M',100,'Active'),
('HairCut/Styling','F',150,'Active'),
('Hair Colouring','F',70,'Active'),
('Hair Treatment','F',250,'Active'),
('Beard Trimming/Shaving','M',60,'Active')
;

INSERT INTO Materials
(`serviceId`,
`itemId`)
VALUES
(1,1),(1,2),(1,4),
(5,1),(5,2),(5,4),
(2,1),(2,2),(2,4),
(3,3),(3,6),(3,5),
(4,4);


create trigger inventoryadd after insert on appointmentservices for each row update Inventory,materials,appointmentservices set inventory.qtyAvail=inventory.qtyAvail -1 where appointmentservices.appointmentId = new.appointmentId and materials.serviceId = appointmentservices.serviceId and inventory.itemId = materials.itemId;


create trigger inventorydel
before delete
on appointmentservices
for each row
update Inventory,materials,appointmentservices
set inventory.qtyAvail=inventory.qtyAvail +1
where appointmentservices.appointmentId = old.appointmentId
and materials.serviceId = appointmentservices.serviceId
and inventory.itemId = materials.itemId;


select * from appointments;
select * from appointmentservices;
select * from blocklist;
select * from customers;
select * from inventory;
select * from materials;
select * from orders;
select * from services;