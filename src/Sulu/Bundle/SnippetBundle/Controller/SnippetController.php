<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\SnippetBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use Sulu\Component\Content\Mapper\ContentMapper;
use Sulu\Component\Content\StructureInterface;
use Sulu\Component\Content\StructureManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Sulu\Bundle\SnippetBundle\Snippet\SnippetRepository;
use FOS\RestBundle\View\ViewHandler;
use FOS\RestBundle\View\View;
use Symfony\Component\Security\Core\SecurityContext;
use Sulu\Component\Content\Mapper\ContentMapperRequest;
use FOS\RestBundle\Controller\Annotations\Prefix;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use PHPCR\Util\UUIDHelper;
use FOS\RestBundle\Controller\Annotations\Get;

/**
 * handles snippets
 */
class SnippetController
{
    /**
     * @var ContentMapper
     */
    protected $contentMapper;

    /**
     * @var StructureManager
     */
    protected $structureManager;

    /**
     * @var ViewHandler
     */
    protected $viewHandler;

    /**
     * @Var SnippetRepository
     */
    protected $snippetRepository;

    /**
     * @var SecurityContext
     */
    protected $securityContext;

    /**
     * @var UrlGeneratorInterface
     */
    protected $urlGenerator;

    protected $languageCode;

    /**
     * Constructor
     */
    public function __construct(
        ViewHandler $viewHandler,
        ContentMapper $contentMapper,
        StructureManager $structureManager,
        SnippetRepository $snippetRepository,
        SecurityContext $securityContext,
        UrlGeneratorInterface $urlGenerator
    ) {
        $this->viewHandler = $viewHandler;
        $this->contentMapper = $contentMapper;
        $this->structureManager = $structureManager;
        $this->snippetRepository = $snippetRepository;
        $this->securityContext = $securityContext;
        $this->urlGenerator = $urlGenerator;
    }

    /**
     * Returns list of snippets
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function getSnippetsAction(Request $request)
    {
        $this->initEnv($request);

        $type = $request->query->get('type', null);
        $uuidsString = $request->get('ids');

        if ($uuidsString) {
            $uuids = explode(',', $uuidsString);
            $snippets = $this->snippetRepository->getSnippetsByUuids($uuids, $this->languageCode);
        } else {
            $snippets = $this->snippetRepository->getSnippets(
                $this->languageCode,
                $type,
                null,
                null,
                $request->get('search'),
                $request->get('sortBy'),
                $request->get('sortOrder')
            );
        }

        $data = array();

        foreach ($snippets as $snippet) {
            $data[] = $snippet->toArray();
        }

        $data = $this->decorateList($data, $this->languageCode);

        $view = View::create($data);

        return $this->viewHandler->handle($view);
    }

    /**
     * Returns snippet by ID
     * @param Request $request
     * @param string $uuid
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @Get(defaults={"uuid" = ""})
     */
    public function getSnippetAction(Request $request, $uuid = null)
    {
        $this->initEnv($request);

        $snippet = $this->contentMapper->load($uuid, null, $this->languageCode, true);

        $view = View::create($this->decorateSnippet($snippet->toArray(), $this->languageCode));

        return $this->viewHandler->handle($view);
    }

    /**
     * Saves a new snippet
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function postSnippetAction(Request $request)
    {
        $this->initEnv($request);
        $data = $request->request->all();

        $mapperRequest = ContentMapperRequest::create()
            ->setType('snippet')
            ->setTemplateKey($this->getRequired($request, 'template'))
            ->setLocale($this->languageCode)
            ->setUserId($this->getUser()->getId())
            ->setData($data)
            ->setState(intval($request->get('state', StructureInterface::STATE_TEST)));

        $snippet = $this->contentMapper->saveRequest($mapperRequest);
        $view = View::create($this->decorateSnippet($snippet->toArray(), $this->languageCode));

        return $this->viewHandler->handle($view);
    }

    /**
     * Saves a new existing snippet
     * @param Request $request
     * @param string $uuid
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function putSnippetAction(Request $request, $uuid)
    {
        $this->initEnv($request);
        $data = $request->request->all();

        $mapperRequest = ContentMapperRequest::create()
            ->setType('snippet')
            ->setTemplateKey($this->getRequired($request, 'template'))
            ->setUuid($uuid)
            ->setLocale($this->languageCode)
            ->setUserId($this->getUser()->getId())
            ->setData($data)
            ->setState(intval($request->get('state', StructureInterface::STATE_TEST)));

        $snippet = $this->contentMapper->saveRequest($mapperRequest);
        $view = View::create($this->decorateSnippet($snippet->toArray(), $this->languageCode));

        return $this->viewHandler->handle($view);
    }

    /**
     * Deletes an existing Snippet
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function deleteSnippetAction(Request $request, $uuid)
    {
        $webspaceKey = $request->query->get('webspace', null);
        $this->contentMapper->delete($uuid, $webspaceKey);

        return new JsonResponse();
    }

    /**
     * TODO refactor
     * @return JsonResponse
     */
    public function getSnippetFieldsAction()
    {
        return new JsonResponse(
            array(
                array(
                    "name" => "title",
                    "translation" => "public.title",
                    "disabled" => false,
                    "default" => true,
                    "sortable" => true,
                    "type" => "",
                    "width" => "",
                    "minWidth" => "100px",
                    "editable" => false
                ),
                array(
                    "name" => "template",
                    "translation" => "snippets.list.template",
                    "disabled" => false,
                    "default" => true,
                    "sortable" => true,
                    "type" => "",
                    "width" => "",
                    "minWidth" => "",
                    "editable" => false
                ),
                array(
                    "name" => "id",
                    "translation" => "public.id",
                    "disabled" => true,
                    "default" => false,
                    "sortable" => true,
                    "type" => "",
                    "width" => "50px",
                    "minWidth" => "",
                    "editable" => false
                ),
                array(
                    "name" => "created",
                    "translation" => "public.created",
                    "disabled" => true,
                    "default" => false,
                    "sortable" => true,
                    "type" => "date",
                    "width" => "",
                    "minWidth" => "",
                    "editable" => false
                ),
                array(
                    "name" => "changed",
                    "translation" => "public.changed",
                    "disabled" => true,
                    "default" => false,
                    "sortable" => true,
                    "type" => "date",
                    "width" => "",
                    "minWidth" => "",
                    "editable" => false
                ),
            )
        );
    }

    /**
     * Returns user
     */
    private function getUser()
    {
        $token = $this->securityContext->getToken();

        if (null === $token) {
            throw new \InvalidArgumentException('No user is set');
        }

        return $token->getUser();
    }

    /**
     * Initiates the environment
     */
    private function initEnv(Request $request)
    {
        $this->languageCode = $request->query->get('language', null);

        if (!$this->languageCode) {
            throw new \InvalidArgumentException('You must provide the "language" query parameter');
        }
    }

    /**
     * Returns a required parameter
     */
    private function getRequired(Request $request, $parameterName)
    {
        $value = $request->request->get($parameterName);

        if (null === $value) {
            throw new \InvalidArgumentException(
                sprintf(
                    'You must provide a value for the POST parameter "%s"',
                    $parameterName
                )
            );
        }

        return $value;
    }

    /**
     * Decorate the list for HATEOAS
     *
     * TODO: Use the HateoasBundle / JMSSerializer to do this.
     */
    private function decorateList(array $data, $locale)
    {
        return array(
            'page' => 1,
            'limit' => PHP_INT_MAX,
            'pages' => 1,
            'total' => count($data),
            '_links' => array(
                'self' => array(
                    'href' => $this->urlGenerator->generate('get_snippets', array('language' => $locale)),
                ),
                'find' => array(
                    'href' => $this->urlGenerator->generate(
                            'get_snippets',
                            array('language' => $locale, 'search' => '{searchString}')
                        ),
                ),
                'sortable' => array(
                    'href' => $this->urlGenerator->generate(
                            'get_snippets',
                            array('language' => $locale, 'sortBy' => '{sortBy}', 'sortOrder' => '{sortOrder}')
                        ),
                )
            ),
            '_embedded' => array(
                'snippets' => $this->decorateSnippets($data, $locale)
            ),
        );

    }

    /**
     * Decorate snippets for HATEOAS
     */
    private function decorateSnippets(array $snippets, $locale)
    {
        $res = array();
        foreach ($snippets as $snippet) {
            $res[] = $this->decorateSnippet($snippet, $locale);
        }

        return $res;
    }

    /**
     * Decorate snippet for HATEOAS
     */
    private function decorateSnippet(array $snippet, $locale)
    {
        return array_merge(
            $snippet,
            array(
                '_links' => array(
                    'self' => $this->urlGenerator->generate(
                            'get_snippet',
                            array('uuid' => $snippet['id'], 'language' => $locale)
                        ),
                    'delete' => $this->urlGenerator->generate(
                            'delete_snippet',
                            array('uuid' => $snippet['id'], 'language' => $locale)
                        ),
                    'new' => $this->urlGenerator->generate('post_snippet', array('language' => $locale)),
                    'update' => $this->urlGenerator->generate(
                            'put_snippet',
                            array('uuid' => $snippet['id'], 'language' => $locale)
                        ),
                ),
            )
        );
    }
}
