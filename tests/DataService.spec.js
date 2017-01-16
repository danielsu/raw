describe('data service', function () {
    //beforeEach(module("raw"));
    var dataService;

    beforeEach(module("raw.services"));
    beforeEach(inject(function (_dataService_) {
        dataService = _dataService_;
    }));

    it('should return empty array for "null" input', function () {
        var input = null;

        var result = dataService.getMetaDataFromJson(input);

        expect(result).not.toBeNull();
        expect(result.constructor.name).toBe(Array.name);
        expect(result.length).toBe(0);
    });

    it('should return empty array for array with not data input', function () {
        var input = [{}, {}];

        var result = dataService.getMetaDataFromJson(input);

        expect(result).not.toBeNull();
        expect(result.constructor.name).toBe(Array.name);
        expect(result.length).toBe(0);
    });

    it('should return extract metadata from input with nested array (1 level nested)', function () {
        var input = [
            {
                "purchaseDate": 1478931416146,
                "zipCode": "80331",
                "city": "München",
                "articles": [
                    {
                        "name": "Wintermantel",
                        "pricePerPiece": 120,
                        "category": "Oberbekleidung",
                        "amount": 1
                    },
                    {
                        "name": "Wintermantel",
                        "pricePerPiece": 120,
                        "category": "Oberbekleidung",
                        "amount": 1
                    },
                    {
                        "name": "Gutscheinkarte",
                        "pricePerPiece": 40,
                        "category": "Gutscheine",
                        "amount": 1
                    },
                    {
                        "name": "Gutscheinkarte",
                        "pricePerPiece": 40,
                        "category": "Gutscheine",
                        "amount": 1
                    },
                    {
                        "name": "Gutscheinkarte",
                        "pricePerPiece": 40,
                        "category": "Gutscheine",
                        "amount": 1
                    }
                ],
                "totalCost": 360
            }];
        var expected = [
            {key: "purchaseDate", type: Number.name},//Date or Number
            {key: "zipCode", type: String.name},
            {key: "city", type: String.name},
            {key: "articles.name", type: String.name},
            {key: "articles.pricePerPiece", type: Number.name},
            {key: "articles.category", type: String.name},
            {key: "articles.amount", type: Number.name}
        ];

        var result = dataService.getMetaDataFromJson(input);
        var resultString = JSON.stringify(result);

        expect(result).not.toBeNull();
        expect(result.constructor.name).toBe(Array.name);

        expected.forEach(function (item) {
            expect(resultString).toContain('{"key":"' + item.key + '","type":"' + item.type + '"}');
        });
    });

    it("should transform nested array to ORM", function () {
        var input = [
            {
                "purchaseDate": 1478931416146,
                "zipCode": "80331",
                "city": "München",
                "totalCost": 210,
                "articles": [
                    {
                        "name": "Wintermantel",
                        "pricePerPiece": 120,
                        "category": "Oberbekleidung",
                        "amount": 1
                    }, {
                        "name": "Gutscheinkarte",
                        "pricePerPiece": 40,
                        "category": "Gutscheine",
                        "amount": 1
                    }, {
                        "name": "Gutscheinkarte",
                        "pricePerPiece": 50,
                        "category": "Gutscheine",
                        "amount": 1
                    }
                ]
            },
            {
                "purchaseDate": 1478879356383,
                "zipCode": "60306",
                "city": "Frankfurt",
                "totalCost": 142,
                "articles": [
                    {
                        "name": "Pullover",
                        "pricePerPiece": 39,
                        "category": "Hemden",
                        "amount": 3
                    },
                    {
                        "name": "Polohemd",
                        "pricePerPiece": 25,
                        "category": "Hemden",
                        "amount": 1
                    }]
            }
        ];

        var expectedORM = {
            "TopLevel": [
                {
                    "purchaseDate": 1478931416146,
                    "zipCode": "80331",
                    "city": "München",
                    "totalCost": 210
                },
                {
                    "purchaseDate": 1478879356383,
                    "zipCode": "60306",
                    "city": "Frankfurt",
                    "totalCost": 142
                }
            ],
            "articles": [
                {
                    "refName": "TopLevel",
                    "refIndex": 0,
                    "name": "Wintermantel",
                    "pricePerPiece": 120,
                    "category": "Oberbekleidung",
                    "amount": 1
                }, {
                    "refName": "TopLevel",
                    "refIndex": 0,
                    "name": "Gutscheinkarte",
                    "pricePerPiece": 40,
                    "category": "Gutscheine",
                    "amount": 1
                }, {
                    "refName": "TopLevel",
                    "refIndex": 0,
                    "name": "Gutscheinkarte",
                    "pricePerPiece": 50,
                    "category": "Gutscheine",
                    "amount": 1
                },
                {
                    "refName": "TopLevel",
                    "refIndex": 1,
                    "name": "Pullover",
                    "pricePerPiece": 39,
                    "category": "Hemden",
                    "amount": 3
                },
                {
                    "refName": "TopLevel",
                    "refIndex": 1,
                    "name": "Polohemd",
                    "pricePerPiece": 25,
                    "category": "Hemden",
                    "amount": 1
                }
            ]
        };

        var result = dataService.transformNestedDataToORM(input);

        console.debug("result:", result);

        expect(result).toBeDefined();
        expect(result.TopLevel).toBeDefined();
        expect(result.articles).toBeDefined();

        expectedORM.TopLevel.forEach(function (expectedListEntry, index) {
            // check top level data sets
            expect(result.TopLevel[index].purchaseDate).toBe(expectedListEntry.purchaseDate);
            expect(result.TopLevel[index].zipCode).toBe(expectedListEntry.zipCode);
            expect(result.TopLevel[index].city).toBe(expectedListEntry.city);
            expect(result.TopLevel[index].totalCost).toBe(expectedListEntry.totalCost);

        });


        // check to be equal and contain 'refName' and 'refIndex'
        expectedORM.articles.forEach(function (expectedObject, index) {
            var resultObject = result.articles[index];
            var resultString = JSON.stringify(resultObject);
            var expectedPropertyNames = Object.getOwnPropertyNames(expectedObject); // indirect call for array items

            expectedPropertyNames.forEach(function (propName) {

                if (angular.isNumber(expectedObject[propName])) {
                    expect(resultString).toContain('"' + propName + '":' + expectedObject[propName]);
                } else {
                    expect(resultString).toContain('"' + propName + '":"' + expectedObject[propName] + '"');
                }
            });

            expect(resultString).not.toContain('"refIndex": 42');
            expect(resultString).not.toContain('"refName": "unknownProb"');
        });
    });
});