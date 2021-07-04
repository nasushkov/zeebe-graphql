# Zeebe Graphql - an adapter to call GraphQL API from Zeebe

# Usage

* Install [Zeebe Modeller](https://docs.zeebe.io/introduction/install.html#install-the-zeebe-modeler) to model your processes
* Create service task with a type **graphql-service**
* Fill in *input* and *output* parameters
* In *Headers* provide **mutation** (or **query**) and **inputVariables**

Example:

* mutation:
```
mutation UpdateJobsMaterialPrices($input: JobsMaterialUpdateInputType!) {            
  updateJobsMaterialPrices(input: $input)           
}
```
* inputVariables:
```
materialId, price
```