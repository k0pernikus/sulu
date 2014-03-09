<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\TestBundle\Testing;

use DateTime;
use Jackalope\RepositoryFactoryJackrabbit;
use PHPCR\NodeInterface;
use PHPCR\SessionInterface;
use PHPCR\SimpleCredentials;
use PHPCR\Util\NodeHelper;
use Sulu\Component\Content\ContentTypeManager;
use Sulu\Component\Content\Mapper\ContentMapper;
use Sulu\Component\Content\Mapper\ContentMapperInterface;
use Sulu\Component\Content\StructureManagerInterface;
use Sulu\Component\Content\Types\ResourceLocator;
use Sulu\Component\Content\Types\Rlp\Mapper\PhpcrMapper;
use Sulu\Component\Content\Types\Rlp\Strategy\TreeStrategy;
use Sulu\Component\Content\Types\TextArea;
use Sulu\Component\Content\Types\TextLine;
use Sulu\Component\PHPCR\NodeTypes\Base\SuluNodeType;
use Sulu\Component\PHPCR\NodeTypes\Content\ContentNodeType;
use Sulu\Component\PHPCR\NodeTypes\Path\PathNodeType;
use Sulu\Component\PHPCR\SessionManager\SessionManager;
use Sulu\Component\PHPCR\SessionManager\SessionManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\Exception\ServiceNotFoundException;
use Symfony\Component\Security\Core\SecurityContextInterface;

/**
 * prepares repository and basic classes for phpcr test cases
 * @package Sulu\Bundle\TestBundle\Testing
 */
class PhpcrTestCase extends \PHPUnit_Framework_TestCase
{
    /**
     * @var SessionInterface
     */
    protected $session;

    /**
     * @var NodeInterface
     */
    protected $contents;

    /**
     * @var NodeInterface
     */
    protected $routes;

    /**
     * @var ContentMapperInterface
     */
    protected $mapper;

    /**
     * @var ContainerInterface
     */
    protected $container;

    /**
     * @var array
     */
    protected $containerValueMap = array();

    /**
     * @var SessionManagerInterface
     */
    protected $sessionManager;

    /**
     * @var StructureManagerInterface
     */
    protected $structureManager;

    /**
     * @var array
     */
    protected $structureValueMap = array();

    /**
     * @var SecurityContextInterface
     */
    protected $securityContext;

    /**
     * purge webspace at tear down
     */
    public function tearDown()
    {
        if (isset($this->session)) {
            NodeHelper::purgeWorkspace($this->session);
            $this->session->save();
        }
    }

    /**
     * prepares a content mapper
     */
    protected function prepareMapper()
    {
        if ($this->mapper === null) {
            $this->prepareContainer();

            $contentTypeManager = new ContentTypeManager($this->container, 'sulu.content.type.');
            $this->mapper = new ContentMapper($contentTypeManager, 'de', 'default_template', 'sulu_locale');
            $this->mapper->setContainer($this->container);

            $this->prepareSession();
            $this->prepareRepository();

            $this->prepareStructureManager();
            $this->prepareSecurityContext();
            $this->prepareSessionManager();

            $resourceLocator = new ResourceLocator(new TreeStrategy(new PhpcrMapper($this->sessionManager, '/cmf/routes')), 'not in use');
            $this->containerValueMap = array_merge(
                $this->containerValueMap,
                array(
                    'sulu.phpcr.session' => $this->sessionManager,
                    'sulu.content.structure_manager' => $this->structureManager,
                    'sulu.content.type.text_line' => new TextLine('not in use'),
                    'sulu.content.type.text_area' => new TextArea('not in use'),
                    'sulu.content.type.resource_locator' => $resourceLocator,
                    'security.context' => $this->securityContext
                )
            );
        }
    }

    /**
     * prepares a structure manager
     */
    protected function prepareStructureManager()
    {
        if ($this->structureManager === null) {
            $this->structureManager = $this->getMock('\Sulu\Component\Content\StructureManagerInterface');
            $this->structureManager->expects($this->any())
                ->method('getStructure')
                ->will($this->returnCallback(array($this, 'structureCallback')));
        }
    }

    /**
     * provides a callback for structure manager mock: function getStructure
     * @return mixed
     * @throws \Symfony\Component\DependencyInjection\Exception\ServiceNotFoundException
     */
    public function structureCallback()
    {
        $args = func_get_args();
        $id = $args[0];
        if (isset($this->structureValueMap[$id])) {
            return $this->structureValueMap[$id];
        } else {
            return null;
        }
    }

    /**
     * prepares a security context
     */
    protected function prepareSecurityContext()
    {
        if ($this->securityContext === null) {
            $userMock = $this->getMock('\Sulu\Component\Security\UserInterface');
            $userMock->expects($this->any())
                ->method('getId')
                ->will($this->returnValue(1));

            $tokenMock = $this->getMock('\Symfony\Component\Security\Core\Authentication\Token\TokenInterface');
            $tokenMock->expects($this->any())
                ->method('getUser')
                ->will($this->returnValue($userMock));

            $this->securityContext = $this->getMock('\Symfony\Component\Security\Core\SecurityContextInterface');
            $this->securityContext->expects($this->any())
                ->method('getToken')
                ->will($this->returnValue($tokenMock));
        }
    }

    /**
     * prepares a session manager
     */
    protected function prepareSessionManager()
    {
        if ($this->sessionManager === null) {
            $this->sessionManager = new SessionManager(
                new RepositoryFactoryJackrabbit(),
                array(
                    'url' => 'http://localhost:8080/server',
                    'username' => 'admin',
                    'password' => 'admin',
                    'workspace' => 'test'
                ),
                array(
                    'base' => 'cmf',
                    'route' => 'routes',
                    'content' => 'contents'
                )
            );
        }
    }

    /**
     * prepares a container
     */
    protected function prepareContainer()
    {
        if ($this->container === null) {
            $this->container = $this->getMock('\Symfony\Component\DependencyInjection\ContainerInterface');
            $this->container->expects($this->any())
                ->method('get')
                ->will(
                    $this->returnCallback(array($this, 'containerCallback'))
                );
        }
    }

    /**
     * provides a callback for container mock: function get
     * @return mixed
     * @throws \Symfony\Component\DependencyInjection\Exception\ServiceNotFoundException
     */
    public function containerCallback()
    {
        $args = func_get_args();
        $id = $args[0];
        if (isset($this->containerValueMap[$id])) {
            return $this->containerValueMap[$id];
        } else {
            throw new ServiceNotFoundException($id);
        }
    }

    /**
     * prepares a session
     */
    protected function prepareSession()
    {
        if ($this->session === null) {
            $parameters = array('jackalope.jackrabbit_uri' => 'http://localhost:8080/server');
            $factory = new RepositoryFactoryJackrabbit();
            $repository = $factory->getRepository($parameters);
            $credentials = new SimpleCredentials('admin', 'admin');
            $this->session = $repository->login($credentials, 'test');

            $this->prepareRepository();
        }
    }

    /**
     * prepares the repository
     */
    protected function prepareRepository()
    {
        if ($this->contents === null) {
            $this->session->getWorkspace()->getNamespaceRegistry()->registerNamespace('sulu', 'http://sulu.io/phpcr');
            $this->session->getWorkspace()->getNamespaceRegistry()->registerNamespace(
                'sulu_locale',
                'http://sulu.io/phpcr/locale'
            );
            $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new SuluNodeType(), true);
            $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new PathNodeType(), true);
            $this->session->getWorkspace()->getNodeTypeManager()->registerNodeType(new ContentNodeType(), true);

            NodeHelper::purgeWorkspace($this->session);
            $this->session->save();

            $cmf = $this->session->getRootNode()->addNode('cmf');
            $cmf->addMixin('mix:referenceable');
            $this->session->save();

            $default = $cmf->addNode('default');
            $default->addMixin('mix:referenceable');
            $this->session->save();

            $this->contents = $default->addNode('contents');
            $this->contents->setProperty('sulu_locale:de-sulu-template', 'overview');
            $this->contents->setProperty('sulu_locale:en-sulu-template', 'overview');
            $this->contents->setProperty('sulu_locale:de-sulu-changer', 1);
            $this->contents->setProperty('sulu_locale:en-sulu-changer', 1);
            $this->contents->setProperty('sulu_locale:de-sulu-creator', 1);
            $this->contents->setProperty('sulu_locale:en-sulu-creator', 1);
            $this->contents->setProperty('sulu_locale:de-sulu-changed', new DateTime());
            $this->contents->setProperty('sulu_locale:en-sulu-changed', new DateTime());
            $this->contents->setProperty('sulu_locale:de-sulu-created', new DateTime());
            $this->contents->setProperty('sulu_locale:en-sulu-created', new DateTime());
            $this->contents->addMixin('sulu:content');
            $this->session->save();

            $this->routes = $default->addNode('routes');
            $this->routes->setProperty('sulu:content', $this->contents);
            $this->routes->addMixin('sulu:path');
            $this->session->save();
        }
    }
} 
