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
});