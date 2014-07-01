<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\ContentBundle\Tests\Unit\Repository;

use PHPCR\NodeInterface;
use ReflectionMethod;
use Sulu\Bundle\AdminBundle\UserManager\CurrentUserDataInterface;
use Sulu\Bundle\AdminBundle\UserManager\UserManagerInterface;
use Sulu\Bundle\ContentBundle\Repository\NodeRepository;
use Sulu\Bundle\ContentBundle\Repository\NodeRepositoryInterface;
use Sulu\Bundle\TestBundle\Testing\PhpcrTestCase;
use Sulu\Component\Content\Property;
use Sulu\Component\Content\PropertyTag;
use Sulu\Component\Content\StructureExtension\StructureExtension;
use Sulu\Component\Content\Types\ResourceLocator;
use Sulu\Component\Webspace\Localization;
use Sulu\Component\Webspace\Manager\WebspaceCollection;
use Sulu\Component\Webspace\Webspace;

class NodeRepositoryTest extends PhpcrTestCase
{
    /**
     * @var NodeRepositoryInterface
     */
    private $nodeRepository;
    /**
     * @var UserManagerInterface
     */
    private $userManager;
    /**
     * @var CurrentUserDataInterface
     */
    private $currentUserData;

    /**
     * @var WebspaceCollection
     */
    private $webspaceCollection;

    /**
     * @var Webspace
     */
    private $webspace;

    private function prepareGetTestData()
    {
        $data = array(
            'title' => 'Testtitle',
            'tags' => array(
                'tag1',
                'tag2'
            ),
            'url' => '/news/test',
            'article' => 'Test'
        );

        return $this->mapper->save($data, 'overview', 'default', 'en', 1);
    }

    public function testGet()
    {
        $structure = $this->prepareGetTestData();

        $result = $this->nodeRepository->getNode($structure->getUuid(), 'default', 'en');

        $this->assertEquals($structure->getProperty('title')->getValue(), $result['title']);
        $this->assertEquals($structure->getProperty('url')->getValue(), $result['url']);
    }

    public function testDelete()
    {
        $structure = $this->prepareGetTestData();

        $this->nodeRepository->deleteNode($structure->getUuid(), 'default');

        $this->setExpectedException('PHPCR\ItemNotFoundException');
        $this->nodeRepository->getNode($structure->getUuid(), 'default', 'en');
    }

    public function testSave()
    {
        $structure = $this->prepareGetTestData();

        $this->nodeRepository->saveNode(
            array(
                'title' => 'asdf'
            ),
            'overview',
            'default',
            'en',
            1,
            $structure->getUuid()
        );

        // new session (because of jackrabbit bug)
        $this->userManager = null;
        $this->nodeRepository = null;
        $this->mapper = null;
        $this->userManager = null;

        $this->prepareUserManager();
        $this->prepareMapper(false);
        $this->prepareNodeRepository();

        $result = $this->nodeRepository->getNode($structure->getUuid(), 'default', 'en');

        $this->assertEquals('asdf', $result['title']);
        $this->assertEquals($structure->getProperty('url')->getValue(), $result['url']);
    }

    public function testSaveNewNode()
    {
        $structure = $this->prepareGetTestData();

        $node = $this->nodeRepository->saveNode(
            array(
                'title' => 'asdf',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/news/test/asdf',
                'article' => 'Test'
            ),
            'overview',
            'default',
            'en',
            1,
            null,
            $structure->getUuid()
        );

        $result = $this->nodeRepository->getNode($node['id'], 'default', 'en');

        $this->assertEquals('asdf', $result['title']);
        $this->assertEquals('/news/test/asdf', $result['url']);

        $node = $this->nodeRepository->saveNode(
            array(
                'title' => 'asdf',
                'tags' => array(
                    'tag1',
                    'tag2'
                ),
                'url' => '/asdf',
                'article' => 'Test'
            ),
            'overview',
            'default',
            'en',
            1
        );

        $result = $this->nodeRepository->getNode($node['id'], 'default', 'en');

        $this->assertEquals('asdf', $result['title']);
        $this->assertEquals('/asdf', $result['url']);
    }

    public function testIndexNode()
    {
        $data = array(
            'title' => 'Testtitle',
        );
        $this->nodeRepository->saveIndexNode(
            $data,
            'overview',
            'default',
            'en',
            1
        );

        $index = $this->nodeRepository->getIndexNode('default', 'en');

        $this->assertEquals('Testtitle', $index['title']);
    }

    public function testGetWebspaceNode()
    {
        $result = $this->nodeRepository->getWebspaceNode('default', 'en');

        $this->assertEquals('Test', $result['_embedded'][0]['title']);
    }

    public function testGetNodesTree()
    {
        $data = $this->prepareGetTestData();

        // without webspace
        $result = $this->nodeRepository->getNodesTree($data->getUuid(), 'default', 'en', false, false);
        $this->assertEquals(1, sizeof($result['_embedded']));
        $this->assertEquals('Testtitle', $result['_embedded'][0]['title']);
        $this->assertEquals('/testtitle', $result['_embedded'][0]['path']);
        $this->assertFalse($result['_embedded'][0]['hasSub']);

        // with webspace
        $result = $this->nodeRepository->getNodesTree($data->getUuid(), 'default', 'en', false, true);
        $this->assertEquals(1, sizeof($result['_embedded']));
        $this->assertEquals('Test', $result['_embedded'][0]['title']);
        $this->assertEquals('/', $result['_embedded'][0]['path']);
        $this->assertTrue($result['_embedded'][0]['hasSub']);

        $this->assertEquals(1, sizeof($result['_embedded'][0]['_embedded']));
        $this->assertEquals('Testtitle', $result['_embedded'][0]['_embedded'][0]['title']);
        $this->assertEquals('/testtitle', $result['_embedded'][0]['_embedded'][0]['path']);
        $this->assertFalse($result['_embedded'][0]['_embedded'][0]['hasSub']);
    }

    public function testExtensionData()
    {
        $data = $this->prepareGetTestData();
        $extData = array('a' => 'A', 'b' => 'B');

        $result = $this->nodeRepository->loadExtensionData($data->getUuid(), 'test1', 'default', 'en');
        $this->assertEquals('', $result['a']);
        $this->assertEquals('', $result['b']);
        $this->assertEquals('/testtitle', $result['path']);

        $result = $this->nodeRepository->saveExtensionData($data->getUuid(), $extData, 'test1', 'default', 'en', 1);
        $this->assertEquals('A', $result['a']);
        $this->assertEquals('B', $result['b']);
        $this->assertEquals('/testtitle', $result['path']);

        $result = $this->nodeRepository->loadExtensionData($data->getUuid(), 'test1', 'default', 'en');
        $this->assertEquals('A', $result['a']);
        $this->assertEquals('B', $result['b']);
        $this->assertEquals('/testtitle', $result['path']);
    }

    protected function setUp()
    {
        $this->prepareMapper();
        $this->prepareNodeRepository();
    }

    private function prepareNodeRepository()
    {
        $this->prepareUserManager();
        $this->prepareWebspaceManager();

        $this->webspaceCollection = $this->getMock('Sulu\Component\Webspace\Manager\WebspaceCollection');
        $this->webspace = new Webspace();
        $this->webspace->setName('Test');
        $this->webspace->setKey('default');

        $locale = new Localization();
        $locale->setLanguage('en');
        $this->webspace->addLocalization($locale);

        $this->webspaceManager->expects($this->any())
            ->method('getWebspaceCollection')
            ->will($this->returnValue($this->webspaceCollection));

        $this->webspaceManager->expects($this->any())
            ->method('findWebspaceByKey')
            ->will($this->returnValue($this->webspace));

        $this->webspaceCollection->expects($this->any())
            ->method('getWebspace')
            ->will($this->returnValue($this->webspace));

        $this->webspaceManager->expects($this->any())
            ->method('findWebspaceByKey')
            ->will($this->returnValue($this->webspace));

        $this->nodeRepository = new NodeRepository(
            $this->mapper,
            $this->sessionManager,
            $this->userManager,
            $this->webspaceManager
        );
    }

    private function prepareUserManager()
    {
        $this->userManager = $this->getMock(
            '\Sulu\Bundle\AdminBundle\UserManager\UserManagerInterface',
            array('getCurrentUserData', 'getUsernameByUserId', 'getFullNameByUserId'),
            array(),
            '',
            false
        );
        $this->currentUserData = $this->getMock(
            '\Sulu\Bundle\AdminBundle\UserManager\CurrentUserDataInterface'
        );

        $this->currentUserData
            ->expects($this->any())
            ->method('getId')
            ->will($this->returnValue(1));

        $this->userManager
            ->expects($this->any())
            ->method('getFullNameByUserId')
            ->will($this->returnValue('Max Mustermann'));
        $this->userManager
            ->expects($this->any())
            ->method('getCurrentUserData')
            ->will($this->returnValue($this->currentUserData));
    }

    public function structureCallback()
    {
        $args = func_get_args();
        $structureKey = $args[0];

        if ($structureKey == 'overview') {
            return $this->getStructureMock(1);
        } elseif ($structureKey == 'default') {
            return $this->getStructureMock(2);
        }

        return null;
    }

    public function getStructureMock($type = 1)
    {
        $structureMock = $this->getMockForAbstractClass(
            '\Sulu\Component\Content\Structure',
            array('overview', 'asdf', 'asdf', 2400)
        );

        $structureMock->setExtensions(array(new TestExtension('test1', 'test1')));

        $method = new ReflectionMethod(
            get_class($structureMock), 'addChild'
        );

        $method->setAccessible(true);
        $method->invokeArgs(
            $structureMock,
            array(
                new Property('title', 'title', 'text_line', false, false, 1, 1, array(),
                    array(
                        new PropertyTag('sulu.node.name', 100)
                    )
                )
            )
        );

        $method->invokeArgs(
            $structureMock,
            array(
                new Property('url', 'url', 'resource_locator')
            )
        );

        if ($type == 1) {
            $method->invokeArgs(
                $structureMock,
                array(
                    new Property('tags', 'tags', 'text_line', false, false, 2, 10)
                )
            );

            $method->invokeArgs(
                $structureMock,
                array(
                    new Property('article', 'article', 'text_area')
                )
            );
        } elseif ($type == 2) {
            $method->invokeArgs(
                $structureMock,
                array(
                    new Property('blog', 'blog', 'text_area')
                )
            );
        }

        return $structureMock;
    }
}

class TestExtension extends StructureExtension
{
    protected $properties = array(
        'a',
        'b'
    );

    function __construct($name, $additionalPrefix = null)
    {
        $this->name = $name;
        $this->additionalPrefix = $additionalPrefix;
    }

    /**
     * {@inheritdoc}
     */
    public function save(NodeInterface $node, $data, $webspaceKey, $languageCode)
    {
        $this->data = $data;
        $node->setProperty($this->getPropertyName('a'), $data['a']);
        $node->setProperty($this->getPropertyName('b'), $data['b']);
    }

    /**
     * {@inheritdoc}
     */
    public function load(NodeInterface $node, $webspaceKey, $languageCode)
    {
        $this->data = array(
            'a' => $node->getPropertyValueWithDefault($this->getPropertyName('a'), ''),
            'b' => $node->getPropertyValueWithDefault($this->getPropertyName('b'), '')
        );
    }
}

