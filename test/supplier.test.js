const chai                                  = require('chai');
const chaiHttp                              = require('chai-http');
const faker                                 = require('faker');
const app                                   = require('../server');
const createUserAdminAndLogin               = require('./utils/createUserAdminAndLogin');
const {createSuppliers, deleteAllSuppliers} = require('./utils/createSuppliers');

chai.use(chaiHttp);
chai.should();

const expect = chai.expect;

let credentials;

describe('Suppliers', () => {
    beforeEach(async () => {
        await deleteAllSuppliers();
        credentials = await createUserAdminAndLogin();
    });

    describe('POST /api/v2/supplier', () => {
        it('Create supplier and get it with the code', async () => {
            const supplier = await createSuppliers();
            const res      = await chai.request(app)
                .post('/api/v2/supplier')
                .set('authorization', credentials.token)
                .send({PostBody: {filter: {code: supplier.code}, limit: 99}});
            expect(res).to.have.status(200);
            expect(res.body.name).be.equals(supplier.name);
        });
        it('Create supplier and get it with the id - w/o authentication', async () => {
            const supplier = await createSuppliers();
            const res      = await chai.request(app)
                .post('/api/v2/supplier')
                .send({PostBody: {filter: {_id: supplier._id}, limit: 99}});
            expect(res).to.have.status(200);
        });
        it('Create supplier and get it with the id - w/o the good id', async () => {
            await createSuppliers();
            const res = await chai.request(app)
                .post('/api/v2/supplier')
                .set('authorization', credentials.token)
                .send({PostBody: {filter: {_id: '111111111111111111111111'}, limit: 99}});
            expect(res).to.have.status(200);
            expect(res.body).to.be.equal(null);
        });
    });
    describe('DELETE /api/v2/supplier/:id', () => {
        it('Create supplier and delete it (use the ID)', async () => {
            const supplier = await createSuppliers();
            const res      = await chai.request(app)
                .delete(`/api/v2/supplier/${supplier._id}`)
                .set('authorization', credentials.token);
            expect(res).to.have.status(200);
        });
        it('Create supplier and delete it - w/o authentication', async () => {
            const supplier = await createSuppliers();
            const res      = await chai.request(app)
                .delete(`/api/v2/supplier/${supplier._id}`);
            expect(res).to.have.status(401);
            expect(res.body).have.property('code');
            expect(res.body.code).to.be.equal('Unauthorized');
        });
        it('Create supplier and delete it - w/o the good ID', async () => {
            await createSuppliers();
            const res = await chai.request(app)
                .delete('/api/v2/supplier/111111111111111111111111')
                .set('authorization', credentials.token);
            expect(res).to.have.status(200);
            // TODO fix services suplliers to not send back 200 but use 'findOneAndDelete'
        });
    });

    describe('PUT /api/v2/supplier', () => {
        it('Try creating a supplier', async () => {
            const codeRandom = faker.lorem.slug();
            const nameRandom = faker.name.title();
            const res        = await chai.request(app)
                .put('/api/v2/supplier')
                .set('authorization', credentials.token)
                .send({code: codeRandom, name: nameRandom});
            expect(res).to.have.status(200);
        });
        it('Try creating a supplier with code (name) that already exists', async () => {
            const codeRandom = faker.lorem.slug();
            const nameRandom = faker.name.title();
            await createSuppliers({name: nameRandom, code: codeRandom});
            const res = await chai.request(app)
                .put('/api/v2/supplier')
                .set('authorization', credentials.token)
                .send({code: codeRandom, name: nameRandom});
            expect(res.body.code).to.be.equal('CodeExisting');
        });
        it('Try creating a supplier - w/o authentication', async () => {
            const codeRandom = faker.lorem.slug();
            const nameRandom = faker.name.title();
            const res        = await chai.request(app)
                .put('/api/v2/supplier')
                .send({code: codeRandom, name: nameRandom});
            expect(res).to.have.status(401);
            expect(res.body).have.property('code');
            expect(res.body.code).to.be.equal('Unauthorized');
        });
    });
    describe('DELETE /api/v2/supplier/:id', () => {
        it('Get all supplier of the first page and delete them one by one', async () => {
            await createSuppliers();
            const res = await chai.request(app)
                .post('/api/v2/suppliers')
                .set('authorization', credentials.token)
                .send({PostBody: {filter: {}, structure: '*', limit: 20, page: 1}});
            for (const element of res.body.datas) {
                const deleteOne = await chai.request(app)
                    .delete(`/api/v2/supplier/${element._id}`)
                    .set('authorization', credentials.token);
                expect(deleteOne).to.have.status(200);
            }
        });
        it('Try delete a supplier - w/o authentication', async () => {
            const supplier = await createSuppliers();
            const res      = await chai.request(app)
                .delete(`/api/v2/supplier/${supplier._id}`);
            expect(res).to.have.status(401);
            expect(res.body).have.property('code');
            expect(res.body.code).to.be.equal('Unauthorized');
        });
        it('Try delete a supplier - w/o the good ID', async () => {
            await createSuppliers();
            const res = await chai.request(app)
                .delete('/api/v2/supplier/111111111111111111111111')
                .set('authorization', credentials.token);
            expect(res).to.have.status(200);
            // TODO fix services suplliers to not send back 200 but use 'findOneAndDelete'
        });
    });
});