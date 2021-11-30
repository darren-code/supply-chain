'use-strict'

const { Contract } = require('fabric-contract-api')

const EVENT_NAME = 'chaincodeEvent';

class SupplyChain extends Contract {
    async InitLedger(ctx) {
        const supplies = [
            {
                ID: 'SFUPMCQG',
                Unit: 'kg',
                Amount: 5, 
                Owner: 'Junior',
                Humidity: 49.8,
                Temperature: 70,
                Oxygen: 89,
                CO: 80,
                Type: 'Cruciferous',
                Name: 'Broccoli',
                Longitude: 44,
                Latitude: 37,
                Site: 'McDonald Distribution Center',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
            {
                ID: '3QCH5HVE',
                Unit: 'pcs',
                Amount: 5, 
                Owner: 'Jonathan',
                Humidity: 49.8,
                Temperature: 70,
                Oxygen: 89,
                CO: 80,
                Type: 'Allium',
                Name: 'Garlic',
                Longitude: 44,
                Latitude: 37,
                Site: 'Penny Lane',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
            {
                ID: 'TOLHEHVW',
                Unit: 'lbs',
                Amount: 15, 
                Owner: 'Chris',
                Humidity: 49.8,
                Temperature: 87.9,
                Oxygen: 44.3,
                CO: 43.4,
                Type: 'Edible Plant Stem',
                Name: 'Asparagus',
                Longitude: 44,
                Latitude: 37,
                Site: 'Green Lane',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
            {
                ID: '537KQHJG',
                Unit: 'bundle',
                Amount: 25, 
                Owner: 'Timothy',
                Humidity: 57.8,
                Temperature: 78,
                Oxygen: 56,
                CO: 45,
                Type: 'Root',
                Name: 'Potato',
                Longitude: 44,
                Latitude: 37,
                Site: 'Green Field',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
            {
                ID: 'OD4ISLX7',
                Unit: 'kg',
                Amount: 5, 
                Owner: 'Jimmy',
                Humidity: 34.8,
                Temperature: 64,
                Oxygen: 91,
                CO: 73,
                Type: 'Marrow',
                Name: 'Cucumber',
                Longitude: 44,
                Latitude: 37,
                Site: 'Green Garden',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
            {
                ID: 'ZS3TNC7V',
                Unit: 'ounces',
                Amount: 15, 
                Owner: 'Darren',
                Humidity: 49.8,
                Temperature: 89,
                Oxygen: 74,
                CO: 90,
                Type: 'Leafy Green',
                Name: 'Spinach',
                Longitude: 44,
                Latitude: 37,
                Site: 'Green Farm',
                Date: '31-12-2021',
                Time: '23:59:59',
            },
        ]

        for (const supply of supplies) {
            supply.docType = 'supply'
            await ctx.stub.putState(supply.ID, Buffer.from(JSON.stringify(supply)))
            console.info(`Supply ${supply.ID} initialized`)
        }
    }

    async AddSupply(ctx, id, unit, amount, owner, humidity, temperature, oxygen, carbondioxide, category, name, long, lat, site, date, time) {
        let usertype = await this.getCurrentUserType(ctx);
        if (usertype != "admin") {
            throw new Error(`This user does have access to create an supply`);
        }

        const exists = await this.IsSupplyExist(ctx, id)
        if (exists) {
            throw new Error(`The supply ${id} already exists`)
        }

        const supply = {
            ID: id,
            Unit: unit,
            Amount: amount,
            Owner: owner,
            Humidity: humidity,
            Temperature: temperature,
            Oxygen: oxygen,
            CO: carbondioxide,
            Type: category,
            Name: name,
            Longitude: long,
            Latitude: lat,
            Site: site,
            Date: date,
            Time: time,
        }

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(supply)))
        await ctx.stub.setEvent(EVENT_NAME, Buffer.from(JSON.stringify(supply)))

        return JSON.stringify(supply)
    }

    async GetSupply(ctx, id) {
        const supplyJSON = await ctx.stub.getState(id)
        if (!supplyJSON || supplyJSON.length == 0) {
            throw new Error(`The supply ${id} does not exists`)
        }
        return supplyJSON.toString()
    }

    async UpdateSupply(ctx, id, id, unit, amount, owner, humidity, temperature, oxygen, carbondioxide, category, name, long, lat, site, date, time) {
        let usertype = await this.getCurrentUserType(ctx);
        if (usertype != "admin") {
            throw new Error(`This user does have access to create an supply`);
        }

        const exists = await this.IsSupplyExist(ctx, id)
        if (!exists) {
            throw new Error(`The supply ${id} does not exists`)
        }

        const updatedSupply = {
            ID: id,
            Unit: unit,
            Amount: amount,
            Owner: owner,
            Humidity: humidity,
            Temperature: temperature,
            Oxygen: oxygen,
            CO: carbondioxide,
            Type: category,
            Name: name,
            Longitude: long,
            Latitude: lat,
            Site: site,
            Date: date,
            Time: time,
        }

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedSupply)))
        await ctx.stub.setEvent(EVENT_NAME, Buffer.from(JSON.stringify(updatedSupply)))

        return true
    }

    async RemoveSupply(ctx, id) {
        let usertype = await this.getCurrentUserType(ctx);
        if (usertype != "admin") {
            throw new Error(`This user does have access to create an supply`);
        }

        const exists = await this.IsSupplyExist(ctx, id)
        if (!exists) {
            throw new Error(`The supply ${id} does not exists`)
        }
        await ctx.stub.deleteState(id)
        await ctx.stub.setEvent(EVENT_NAME, Buffer.from(JSON.stringify({ID: id})))

        return true
    }

    async IsSupplyExist(ctx, id) {
        const supplyJSON = await ctx.stub.getState(id)
        return supplyJSON && supplyJSON.length > 0
    }

    async TransferSupply(ctx, id, newOwner) {
        let usertype = await this.getCurrentUserType(ctx);
        if (usertype != "admin") {
            throw new Error(`This user does have access to create an supply`);
        }
        
        const supplyString = await this.GetSupply(ctx, id)
        const supply = JSON.parse(supplyString)
        supply.Owner = newOwner
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(supply)))
        await ctx.stub.setEvent(EVENT_NAME, Buffer.from(JSON.stringify(supply)))

        return true
    }

    async GetAllSupplies(ctx) {
        const allResults = []
        const iterator = await ctx.stub.getStateByRange('', '')
        let result = await iterator.next()
        while (!result.done) {
            const strValue = result.value.value.toString('utf8')
            let record
            try {
                record = JSON.parse(strValue)
            } catch (err) {
                console.log(err)
                record = strValue
            }
            allResults.push({ Key: result.value.key, Record: record })
            result = await iterator.next()
        }
        return JSON.stringify(allResults)
    }

    async GetSupplyHistory(ctx, id) {
        const allResults = []
        const iterator = await ctx.stub.getHistoryForKey(id)

        while (true) {
            console.log('Getting supply history data')
            let result = await iterator.next()

            if (result.value && result.value.value.toString()) {
                let record = {}
                record.TxId = result.value.tx_id
                record.IsDelete = result.value.is_delete.toString()
                let d = new Date(0)
                d.setUTCSeconds(result.value.timestamp.seconds.low)
                record.timestamp = d.toLocaleString("en-US", { timezone: "Asia/Jakarta" })

                const strValue = result.value.value.toString('utf8')
                try {
                    record.Value = JSON.parse(strValue)
                } catch (err) {
                    console.log(err)
                    record.Value = strValue
                }
                allResults.push(record)
            }

            if (result.done) {
                await iterator.close()
                return JSON.stringify(allResults)
            }
        }
    }

    async getCurrentUserId(ctx) {
        let id = [];
        id.push(ctx.clientIdentity.getID());
        var begin = id[0].indexOf("/CN=");
        var end = id[0].lastIndexOf("::/C=");
        let userid = id[0].substring(begin + 4, end);
        return userid;
    }

    async getCurrentUserType(ctx) {
        let userid = await this.getCurrentUserId(ctx);
        console.log('userid', userid);
        if (userid == "admin" || userid == "Admin@org1.example.com" || userid == "Admin@org2.example.com") {
            return "admin";
        }
        return ctx.clientIdentity.getAttributeValue("usertype");
    }
}

module.exports = SupplyChain