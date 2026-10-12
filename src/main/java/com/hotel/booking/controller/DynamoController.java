package com.hotel.booking.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.ListTablesResponse;

@RestController
public class DynamoController {

    private final DynamoDbClient dynamoDbClient;

    public DynamoController(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @GetMapping("/test-dynamodb")
    public String testDynamoDB() {

        ListTablesResponse response = dynamoDbClient.listTables();

        return "DynamoDB connected! Tables: "
                + response.tableNames();
    }
}