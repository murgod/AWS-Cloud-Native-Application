
const expect = require("chai").expect;
const testcases = require("../test-cases/validation");

describe("validatePassword()", function(){
    it("shoud check for password against NIST standard", function(){
        var results = testcases.validatePassword("123");
        expect(results).to.equals(false);
    });

    it("shoud check for password against NIST standard", function(){
        var results = testcases.validatePassword("Aabcd@123");
        expect(results).to.equals(true);
    });
});