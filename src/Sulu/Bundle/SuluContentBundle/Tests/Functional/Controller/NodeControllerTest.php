<?php

namespace Sulu\Bundle\ContentBundle\Tests\Controller;

use PHPCR\NodeInterface;
use PHPCR\SimpleCredentials;
use Sulu\Component\PHPCR\NodeTypes\Base\SuluNodeType;
use Sulu\Component\PHPCR\NodeTypes\Content\ContentNodeType;
use Sulu\Component\PHPCR\NodeTypes\Path\PathNodeType;
use Sulu\Bundle\TestBundle\Testing\DatabaseTestCase;
use PHPCR\SessionInterface;
use PHPCR\Util\NodeHelper;
use Sulu\Component\Content\Mapper\ContentMapperInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Sulu\Bundle\ContactBundle\Entity\Contact;
use Sulu\Bundle\SecurityBundle\Entity\Role;
use Sulu\Bundle\SecurityBundle\Entity\User;
use Sulu\Bundle\SecurityBundle\Entity\UserRole;
use Sulu\Bundle\SecurityBundle\Entity\Permission;
use Sulu\Bundle\ContactBundle\Entity\Email;
use Sulu\Bundle\ContactBundle\Entity\EmailType;

use DateTime;

class NodeControllerTest extends DatabaseTestCase
{
    /**
     * @var array
     */
    protected static $entities;

    /**
     * @var SchemaTool
     */
    protected static $tool;

    /**
     * @var SessionInterface
     */
    public $session;

    protected function setUp()
    {
        $this->setUpSchema();

        $contact = new Contact();
        $contact->setFirstName('Max');
        $contact->setLastName('Mustermann');
        $contact->setCreated(new DateTime());
        $contact->setChanged(new DateTime());
        self::$em->persist($contact);

        $emailType = new EmailType();
        $emailType->setName('Private');
        self::$em->persist($emailType);

        $email = new Email();
        $email->setEmail('max.mustermann@muster.at');
        $email->setEmailType($emailType);
        self::$em->persist($email);
        self::$em->flush();

        $role1 = new Role();
        $role1->setName('Role1');
        $role1->setSystem('Sulu');
        $role1->setChanged(new DateTime());
        $role1->setCreated(new DateTime());
        self::$em->persist($role1);

        $user = new User();
        $user->setUsername('admin');
        $user->setPassword('securepassword');
        $user->setSalt('salt');
        $user->setLocale('de');
        $user->setContact($contact);
        self::$em->persist($user);
        self::$em->flush();

        $userRole1 = new UserRole();
        $userRole1->setRole($role1);
        $userRole1->setUser($user);
        $userRole1->setLocale(json_encode(array('de', 'en')));
        self::$em->persist($userRole1);

        $permission1 = new Permission();
        $permission1->setPermissions(122);
        $permission1->setRole($role1);
        $permission1->setContext("Context 1");
        self::$em->persist($permission1);
        self::$em->flush();

        $this->prepareSession();

        NodeHelper::purgeWorkspace($this->session);
        $this->session->save();

        $this->prepareRepository();
        $this->session->save();

        $cmf = $this->session->getRootNode()->addNode('cmf');
        $webspace = $cmf->addNode('sulu_io');
        $nodes = $webspace->addNode('routes');
        $nodes->addNode('de');
        $nodes->addNode('en');
        $content = $webspace->addNode('contents');
        $content->setProperty('sulu_locale:en-template', 'overview');
        $content->setProperty('sulu_locale:en-creator', 1);
        $content->setProperty('sulu_locale:en-created', new \DateTime());
        $content->setProperty('sulu_locale:en-changer', 1);
        $content->setProperty('sulu_locale:en-changed', new \DateTime());
        $content->addMixin('sulu:content');

        $this->session->save();
    }

    public function prepareRepository()
    {
        $this->session->getWorkspace()->getNamespaceRegistry()->registerNamespace('sulu', 'http://sulu.io/phpcr');
        $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new SuluNodeType(), true);
        $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new PathNodeType(), true);
        $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new ContentNodeType(), true);
        $this->session->getWorkspace()->getNamespaceRegistry()->registerNamespace('sulu', 'http://sulu.io/phpcr');
        $this->session->getWorkspace()->getNamespaceRegistry()->registerNamespace(
            'sulu_locale',
            'http://sulu.io/phpcr/locale'
        );
    }

    private function setUpSchema()
    {
        self::$tool = new SchemaTool(self::$em);

        self::$entities = array(
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Address'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\AddressType'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\ContactLocale'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Country'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Note'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Phone'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\PhoneType'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Url'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\UrlType'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Fax'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\FaxType'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Email'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\EmailType'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Contact'),
            self::$em->getClassMetadata('Sulu\Bundle\ContactBundle\Entity\Account'),
            self::$em->getClassMetadata('Sulu\Bundle\SecurityBundle\Entity\User'),
            self::$em->getClassMetadata('Sulu\Bundle\SecurityBundle\Entity\UserRole'),
            self::$em->getClassMetadata('Sulu\Bundle\SecurityBundle\Entity\Role'),
            self::$em->getClassMetadata('Sulu\Bundle\SecurityBundle\Entity\Permission'),
            self::$em->getClassMetadata('Sulu\Bundle\TagBundle\Entity\Tag')
        );

        self::$tool->dropSchema(self::$entities);
        self::$tool->createSchema(self::$entities);
    }

    private function prepareSession()
    {
        $factoryclass = '\Jackalope\RepositoryFactoryJackrabbit';
        $parameters = array('jackalope.jackrabbit_uri' => 'http://localhost:8080/server');
        $factory = new $factoryclass();
        $repository = $factory->getRepository($parameters);
        $credentials = new SimpleCredentials('admin', 'admin');
        $this->session = $repository->login($credentials, 'test');
    }

    protected function tearDown()
    {
        if ($this->session != null) {
            NodeHelper::purgeWorkspace($this->session);
            $this->session->save();
        }
        self::$tool->dropSchema(self::$entities);
        parent::tearDown();
    }

    public function testPost()
    {
        $data = array(
            'title' => 'Testtitle',
            'tags' => array(
                'tag1',
                'tag2'
            ),
            'url' => '/test',
            'article' => 'Test'
        );

        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );

        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en', $data);

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals('Testtitle', $response->title);
        $this->assertEquals('Test', $response->article);
        $this->assertEquals('/test', $response->url);
        $this->assertEquals(array('tag1', 'tag2'), $response->tags);
        $this->assertEquals(1, $response->creator);
        $this->assertEquals(1, $response->changer);

        $root = $this->session->getRootNode();
        $route = $root->getNode('cmf/sulu_io/routes/en/test');

        /** @var NodeInterface $content */
        $content = $route->getPropertyValue('sulu:content');

        $this->assertEquals('Testtitle', $content->getProperty('sulu_locale:en-title')->getString());
        $this->assertEquals('Test', $content->getProperty('sulu_locale:en-article')->getString());
        $this->assertEquals(array(1, 2), $content->getPropertyValue('sulu_locale:en-tags'));
        $this->assertEquals(1, $content->getPropertyValue('sulu_locale:en-sulu-creator'));
        $this->assertEquals(1, $content->getPropertyValue('sulu_locale:en-sulu-changer'));
    }

    public function testPostTree()
    {
        $data1 = array(
            'title' => 'news',
            'tags' => array(
                'tag1',
                'tag2'
            ),
            'url' => '/news',
            'article' => 'Test'
        );
        $data2 = array(
            'title' => 'test-1',
            'tags' => array(
                'tag1',
                'tag2'
            ),
            'url' => '/news/test',
            'article' => 'Test'
        );

        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en', $data1);
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $uuid = $response->id;

        $client->request(
            'POST',
            '/api/nodes?template=overview&parent=' . $uuid . '&webspace=sulu_io&language=en',
            $data2
        );
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals('test-1', $response->title);
        $this->assertEquals('Test', $response->article);
        $this->assertEquals('/news/test', $response->url);
        $this->assertEquals(array('tag1', 'tag2'), $response->tags);
        $this->assertEquals(1, $response->creator);
        $this->assertEquals(1, $response->changer);

        $root = $this->session->getRootNode();
        $route = $root->getNode('cmf/sulu_io/routes/en/news/test');

        /** @var NodeInterface $content */
        $content = $route->getPropertyValue('sulu:content');

        $this->assertEquals('test-1', $content->getProperty('sulu_locale:en-title')->getString());
        $this->assertEquals('Test', $content->getProperty('sulu_locale:en-article')->getString());
        $this->assertEquals(array(1, 2), $content->getPropertyValue('sulu_locale:en-tags'));
        $this->assertEquals(1, $content->getPropertyValue('sulu_locale:en-sulu-creator'));
        $this->assertEquals(1, $content->getPropertyValue('sulu_locale:en-sulu-changer'));

        // check parent
        $this->assertEquals($uuid, $content->getParent()->getIdentifier());
    }

    private function beforeTestGet()
    {
        $data = array(
            array(
                'title' => 'test1',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/test1',
                'article' => 'Test'
            ),
            array(
                'title' => 'test2',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/test2',
                'article' => 'Test'
            )
        );

        /** @var ContentMapperInterface $mapper */
        $mapper = self::$kernel->getContainer()->get('sulu.content.mapper');

        $mapper->saveStartPage(array('title' => 'Start Page'), 'overview', 'sulu_io', 'de', 1);

        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );

        for ($i = 0; $i < count($data); $i++) {
            $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en', $data[$i]);
            $data[$i] = (array) json_decode($client->getResponse()->getContent());
        }

        return $data;
    }

    public function testGet()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->beforeTestGet();

        $client->request('GET', '/api/nodes/' . $data[0]['id'] . '?webspace=sulu_io&language=en');

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent(), true);

        $this->assertEquals(17, sizeof($response));
        $this->assertEquals($data[0]['title'], $response['title']);
        $this->assertEquals($data[0]['tags'], $response['tags']);
        $this->assertEquals($data[0]['url'], $response['url']);
        $this->assertEquals($data[0]['article'], $response['article']);
    }

    public function testDelete()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->beforeTestGet();

        $client->request('DELETE', '/api/nodes/' . $data[0]['id'] . '?webspace=sulu_io&language=en');
        $this->assertEquals(204, $client->getResponse()->getStatusCode());

        $client->request('GET', '/api/nodes/' . $data[0]['id'] . '?webspace=sulu_io&language=en');
        $this->assertEquals(404, $client->getResponse()->getStatusCode());
    }

    public function testPut()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->beforeTestGet();

        $data[0]['title'] = 'test123';
        $data[0]['tags'] = array('new tag');
        $data[0]['article'] = 'thats a new article';

        $client->request('PUT', '/api/nodes/' . $data[0]['id'] . '?template=overview&webspace=sulu_io&language=en', $data[0]);

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals($data[0]['title'], $response->title);
        $this->assertEquals($data[0]['tags'], $response->tags);
        $this->assertEquals($data[0]['url'], $response->url);
        $this->assertEquals($data[0]['article'], $response->article);
        $this->assertEquals(1, $response->creator);
        $this->assertEquals(1, $response->creator);

        $client->request('GET', '/api/nodes?depth=1&webspace=sulu_io&language=en');

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals(2, $response->total);
        $this->assertEquals(2, sizeof($response->_embedded));

        $this->assertEquals($data[1]['title'], $response->_embedded[0]->title);
        $this->assertEquals($data[0]['title'], $response->_embedded[1]->title);
    }

    private function buildTree()
    {
        $data = array(
            array(
                'title' => 'test1',
                'tags' => array(
                    'tag1',
                ),
                'url' => '/test1',
                'article' => 'Test'
            ),
            array(
                'title' => 'test2',
                'tags' => array(
                    'tag2'
                ),
                'url' => '/test2',
                'article' => 'Test'
            ),
            array(
                'title' => 'test3',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/test3',
                'article' => 'Test'
            ),
            array(
                'title' => 'test4',
                'tags' => array(
                    'tag1',
                ),
                'url' => '/test4',
                'article' => 'Test'
            ),
            array(
                'title' => 'test5',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/test5',
                'article' => 'Test'
            )
        );

        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en', $data[0]);
        $data[0] = (array) json_decode($client->getResponse()->getContent());
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en', $data[1]);
        $data[1] = (array) json_decode($client->getResponse()->getContent());
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en&parent='.$data[1]['id'], $data[2]);
        $data[2] = (array) json_decode($client->getResponse()->getContent());
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en&parent='.$data[1]['id'], $data[3]);
        $data[3] = (array) json_decode($client->getResponse()->getContent());
        $client->request('POST', '/api/nodes?template=overview&webspace=sulu_io&language=en&parent='.$data[3]['id'], $data[4]);
        $data[4] = (array) json_decode($client->getResponse()->getContent());

        return $data;
    }

    public function testTreeGet()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->buildTree();

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=1&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));
        $this->assertEquals($data[0]['title'], $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals($data[1]['title'], $items[1]->title);
        $this->assertTrue($items[1]->hasSub);

        // get subitems (remove /admin for test environment)
        $client->request('GET', str_replace('/admin', '', $items[1]->_links->children));
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));
        $this->assertEquals($data[2]['title'], $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals($data[3]['title'], $items[1]->title);
        $this->assertTrue($items[1]->hasSub);

        // get subitems (remove /admin for test environment)
        $client->request('GET', str_replace('/admin', '', $items[1]->_links->children));
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(1, sizeof($items));
        $this->assertEquals($data[4]['title'], $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
    }

    public function testGetFlat()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->buildTree();

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=1&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=2&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(4, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);

        $this->assertEquals('test3', $items[2]->title);
        $this->assertFalse($items[2]->hasSub);

        $this->assertEquals('test4', $items[3]->title);
        $this->assertTrue($items[3]->hasSub);

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=3&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(5, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);

        $this->assertEquals('test3', $items[2]->title);
        $this->assertFalse($items[2]->hasSub);

        $this->assertEquals('test4', $items[3]->title);
        $this->assertTrue($items[3]->hasSub);

        $this->assertEquals('test5', $items[4]->title);
        $this->assertFalse($items[4]->hasSub);

        // get child nodes from subNode
        $client->request('GET', '/api/nodes?depth=3&webspace=sulu_io&language=en&parent=' . $data[3]['id']);
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(1, sizeof($items));

        $this->assertEquals('test5', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
    }

    public function testGetTree()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->buildTree();

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=1&flat=false&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);
        $this->assertEquals(0, sizeof($items[1]->_embedded));

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=2&flat=false&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);
        $this->assertEquals(2, sizeof($items[1]->_embedded));

        $items = $items[1]->_embedded;

        $this->assertEquals('test3', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        $this->assertEquals('test4', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);
        $this->assertEquals(0, sizeof($items[1]->_embedded));

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=3&flat=false&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(2, sizeof($items));

        $this->assertEquals('test1', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        $this->assertEquals('test2', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);
        $this->assertEquals(2, sizeof($items[1]->_embedded));

        $items = $items[1]->_embedded;

        $this->assertEquals('test3', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        $this->assertEquals('test4', $items[1]->title);
        $this->assertTrue($items[1]->hasSub);
        $this->assertEquals(1, sizeof($items[1]->_embedded));

        $items = $items[1]->_embedded;

        $this->assertEquals('test5', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));

        // get child nodes from subNode
        $client->request('GET', '/api/nodes?depth=3&flat=false&webspace=sulu_io&language=en&parent=' . $data[3]['id']);
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());
        $items = $response->_embedded;

        $this->assertEquals(1, sizeof($items));

        $this->assertEquals('test5', $items[0]->title);
        $this->assertFalse($items[0]->hasSub);
        $this->assertEquals(0, sizeof($items[0]->_embedded));
    }

    public function testSmartContent()
    {
        $this->buildTree();

        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en');
        $response = json_decode($client->getResponse()->getContent())->_embedded;

        $this->assertEquals(6, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&dataSource=%2Ftest2');
        $response = json_decode($client->getResponse()->getContent())->_embedded;

        $this->assertEquals(2, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&dataSource=%2Ftest2&includeSubFolders=true');
        $response = json_decode($client->getResponse()->getContent())->_embedded;

        $this->assertEquals(3, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&dataSource=%2Ftest2&includeSubFolders=true&limitResult=2');
        $response = json_decode($client->getResponse()->getContent())->_embedded;

        $this->assertEquals(2, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&tags=tag1');
        $response = json_decode($client->getResponse()->getContent())->_embedded;

        $this->assertEquals(4, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&tags=tag2');
        $response = json_decode($client->getResponse()->getContent())->_embedded;
        $this->assertEquals(3, sizeof($response));

        $client->request('GET', '/api/nodes/filter?webspace=sulu_io&language=en&tags=tag1,tag2');
        $response = json_decode($client->getResponse()->getContent())->_embedded;
        $this->assertEquals(2, sizeof($response));
    }

    public function testBreadcrumb()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->buildTree();
        $mapper = self::$kernel->getContainer()->get('sulu.content.mapper');
        $mapper->saveStartPage(array('title' => 'Start Page'), 'overview', 'sulu_io', 'en', 1);

        $client->request('GET', '/api/nodes/' . $data[4]['id'] . '?breadcrumb=true&webspace=sulu_io&language=en');

        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent());

        $this->assertEquals($data[4]['title'], $response->title);
        $this->assertEquals($data[4]['tags'], $response->tags);
        $this->assertEquals($data[4]['url'], $response->url);
        $this->assertEquals($data[4]['article'], $response->article);

        $this->assertEquals(3, sizeof($response->breadcrumb));
        $this->assertEquals('Start Page', $response->breadcrumb[0]->title);
        $this->assertEquals('test2', $response->breadcrumb[1]->title);
        $this->assertEquals('test4', $response->breadcrumb[2]->title);
    }

    public function testSmallResponse()
    {
        $client = $this->createClient(
            array(),
            array(
                'PHP_AUTH_USER' => 'test',
                'PHP_AUTH_PW' => 'test',
            )
        );
        $data = $this->buildTree();

        // get child nodes from root
        $client->request('GET', '/api/nodes?depth=1&webspace=sulu_io&language=en');
        $this->assertEquals(200, $client->getResponse()->getStatusCode());
        $response = json_decode($client->getResponse()->getContent(), true);
        $items = $response['_embedded'];

        $this->assertEquals(2, sizeof($items));

        $this->assertEquals(9, sizeof($items[0]));
        $this->assertArrayHasKey('id', $items[0]);
        $this->assertEquals('test1', $items[0]['title']);
        $this->assertEquals(1, $items[0]['nodeState']);
        $this->assertEquals(1, $items[0]['globalState']);
        $this->assertFalse($items[0]['publishedState']);
        $this->assertEquals('main', $items[0]['navigation']);
        $this->assertFalse($items[0]['hasSub']);
        $this->assertEquals(0, sizeof($items[0]['_embedded']));
        $this->assertArrayHasKey('_links', $items[0]);

        $this->assertEquals(9, sizeof($items[1]));
        $this->assertArrayHasKey('id', $items[1]);
        $this->assertEquals('test2', $items[1]['title']);
        $this->assertEquals(1, $items[1]['nodeState']);
        $this->assertEquals(1, $items[1]['globalState']);
        $this->assertFalse($items[1]['publishedState']);
        $this->assertEquals('main', $items[1]['navigation']);
        $this->assertTrue($items[1]['hasSub']);
        $this->assertEquals(0, sizeof($items[1]['_embedded']));
        $this->assertArrayHasKey('_links', $items[1]);
    }
}
