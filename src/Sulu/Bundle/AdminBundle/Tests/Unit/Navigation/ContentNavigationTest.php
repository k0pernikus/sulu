<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\AdminBundle\Navigation;

use Symfony\Component\Console\Command\Command;

class ContentNavigationTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var ContentNavigation
     */
    protected $contentNavigation1;

    /**
     * @var ContentNavigation
     */
    protected $contentNavigation2;

    /**
     * @var Command
     */
    protected $command;

    public function setUp()
    {
        $this->contentNavigation1 = $this->getMockForAbstractClass(
            'Sulu\Bundle\AdminBundle\Navigation\ContentNavigation',
            array(),
            '',
            true,
            true,
            true
        );

        $details = new ContentNavigationItem('Details');
        $details->setGroups(array('contact'));
        $details->setAction('details');
        $this->contentNavigation1->addNavigationItem($details);

        $other = new ContentNavigationItem('Other');
        $other->setGroups(array('test'));
        $other->setAction('other');
        $this->contentNavigation1->addNavigationItem($other);

        $this->contentNavigation2 = $this->getMockForAbstractClass(
            'Sulu\Bundle\AdminBundle\Navigation\ContentNavigationInterface',
            array(),
            '',
            true,
            true,
            true,
            array('getNavigationItems')
        );
        $permissions = new ContentNavigationItem('Permissions');
        $permissions->setGroups(array('contact'));
        $permissions->setAction('permissions');
        $this->contentNavigation2
            ->expects($this->any())
            ->method('getNavigationItems')
            ->will(
                $this->returnValue(array($permissions))
            );
        $this->contentNavigation1->addNavigation($this->contentNavigation2);
    }

    public function testToArray()
    {
        $result = $this->contentNavigation1->toArray('contact');
        $this->assertEquals(2, sizeof($result['items']));

        $this->assertEquals('Details', $result['items'][0]['title']);
        $this->assertEquals('details', $result['items'][0]['action']);

        $this->assertEquals('Permissions', $result['items'][1]['title']);
        $this->assertEquals('permissions', $result['items'][1]['action']);
    }
}
