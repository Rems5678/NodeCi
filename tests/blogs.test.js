const Page = require('./helpers/page');

let page;
beforeEach(async () => {
  try {
    page = await Page.build();
    await page.goto('http://localhost:3000');
  }
  catch(err){
    console.log('there was an error going to the localhost:3000', err);
  }
})

afterEach(async () =>{
  await page.close();
});
describe('when logged in', () => {
  beforeEach(async() => {
    try{
      await page.login();
      await page.click('a.btn-floating');
    }
    catch(err) {
      console.err('there was an error when trying to login', err);
    }
  })

  test('can see blog create form', async () => {
    let label
    try {
      label = await page.getContentsOf('form label');
    }
    catch(err) {
      console.err('err at: "can see blog create form"', err)
    }
    expect(label).toEqual('Blog Title');
  });

  describe('and using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('the form shows an error message', async () => {
      const titleErr = await page.getContentsOf('.title .red-text');
      const contentErr = await page.getContentsOf('.content .red-text');
      const errMessage = 'You must provide a value';
      expect(titleErr).toEqual(errMessage);
      expect(contentErr).toEqual(errMessage);
    })
  });

  describe('and using valid inputs', async () => {
    beforeEach(async () => {
      try {
        await page.type('input[name=title]', 'my title');
        await page.type('input[name=content]', 'my content');
        await page.click('form button');
      }
      catch(err) {
        console.err('err at: "and using valid inputs"', err);
      }
    });

    test('submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('submitting then saving adds blog to index page', async () => {
      try {
        await page.click('button.green');
        await page.waitFor('.card-stacked');
      }
      catch(err) {
        console.error('there was an error when submitting a valid blog', err)
      }
      
      const cardTitle = await page.getContentsOf('.card-title');
      const cardContent = await page.getContentsOf('.card-content p');
      expect(cardTitle).toBeTruthy();
      expect(cardContent).toBeTruthy();
    })
  })

})
describe('when not logged in', () => {
  const actions = [
    {method: 'get', path:'/api/blogs'},
    {method: 'post', path:'/api/blogs', body: {title: 'T', content: 'C'}}
  ]
  test('Blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      expect(result.error).toEqual("You must log in!");
    }
  })
  // test('throws an error when making a post request to blogs api', async () => {
  //   let res;
  //   try {
  //     page.post('/api/blogs', {title: 'MyTitle', content: 'MyContent'})
  //   }
  //   catch(err) {
  //     console.error('error at: "throws an error when making a post request to blogs api"', err)
  //   }
  //   expect(res.error).toEqual("You must log in!")
  // })

  // test.only('throws an error when making a get request to blogs api', async () => {
  //   let result;
  //   try {
  //     result = await page.get('/api/blogs');
  //   }
  //   catch(err) {
  //     console.error('error at: "throws an error when making a get request to blogs api"', err);
  //   }
  //   expect(result.error).toEqual('You must log in!');
  // })
})
