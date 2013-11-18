<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\WebsiteBundle\Controller;

use Sulu\Component\Content\Structure;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;

/**
 * Default Controller for rendering templates, uses the themes from the ClientWebsiteBundle
 * @package Sulu\Bundle\WebsiteBundle\Controller
 */
class DefaultController extends Controller
{
    /**
     * Loads the content from the request (filled by the route provider) and creates a response with this content and
     * the appropriate cache headers
     * @return Response
     */
    public function indexAction()
    {
        /** @var Structure $structure */
        $structure = $this->getRequest()->get('content');
        $content = $this->renderView(
            'ClientWebsiteBundle:Website:' . $structure->getKey() . '.html.twig',
            array('content' => $structure)
        );

        $response = new Response();

        $response->setPublic();
        $response->setPrivate();
        $response->setSharedMaxAge($structure->getCacheLifeTime());
        $response->setMaxAge($structure->getCacheLifeTime());

        $response->setContent($content);

        return $response;
    }
}
